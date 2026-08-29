"use client";

import { useEffect, useMemo, useState } from "react";
import { changeGroups, feedbackReasons, questions, scenarios, type Move, type Scenario } from "./mock-data";

type Screen = 1 | 2 | 3 | 4;
type Answers = Record<string, string>;

function ContextBar({ scenario, screen, goBack }: { scenario: Scenario; screen: Screen; goBack: () => void }) {
  return <header className="context-bar">
    {screen > 1 ? <button className="back-button" onClick={goBack} aria-label="返回上一页">←</button> : <div className="brand-mark">ID</div>}
    <div className="context-copy"><small>LIVE CONTEXT</small><strong>{scenario.city} · {scenario.time} · {scenario.weather} · {scenario.mode}</strong></div>
    <div className="progress-dots" aria-label={`第 ${screen} 步，共 4 步`}>{[1, 2, 3, 4].map((step) => <i key={step} className={step <= screen ? "active" : ""} />)}</div>
  </header>;
}

function ScenarioSwitcher({ active, onChange }: { active: Scenario; onChange: (scenario: Scenario) => void }) {
  const [open, setOpen] = useState(false);
  return <section className="scenario-switcher">
    <button className="scenario-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}><span>{active.demo} · Mock scenario</span><b>Try another scenario</b><i>{open ? "↑" : "↓"}</i></button>
    {open && <div className="scenario-options">{scenarios.map((scenario) => <button key={scenario.id} className={active.id === scenario.id ? "selected" : ""} onClick={() => { onChange(scenario); setOpen(false); }}><span>{scenario.demo}</span><strong>{scenario.city}</strong><small>{scenario.teaser}</small></button>)}</div>}
  </section>;
}

function ScreenOne({ scenario, selected, setSelected, note, setNote, next, changeScenario }: { scenario: Scenario; selected: string; setSelected: (value: string) => void; note: string; setNote: (value: string) => void; next: () => void; changeScenario: (scenario: Scenario) => void }) {
  return <div className="screen-body screen-one">
    <section className="intro-copy"><p className="kicker">IN-TRIP DECISION · 旅途中即时决策</p><h1>接下来去哪？<small>What’s Next?</small></h1><h2>计划变了，或者你变了。</h2><p>不用重新做攻略，先决定下一步。</p></section>
    <div className="decision-signal" aria-label="从变化到下一步"><span>The world changed.</span><i>or</i><span>I changed.</span><b>→</b><strong>Next move</strong></div>
    {changeGroups.map((group) => <section className="choice-group" key={group.key}><div className="choice-heading"><span>{group.letter}</span><div><small>{group.english}</small><h3>{group.title}</h3><p>{group.description}</p></div></div><div className="chips">{group.options.map((item) => <button key={item} className={selected === item ? "selected" : ""} onClick={() => setSelected(item)}>{item}{selected === item && <b>✓</b>}</button>)}</div></section>)}
    <label className="story-input"><span>或者直接告诉我发生了什么</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="比如：突然下雨了，但我还不想结束今天。" /></label>
    <button className="primary-cta" onClick={next}>决定我的下一步 <span>→</span></button>
    <ScenarioSwitcher active={scenario} onChange={changeScenario} />
    <p className="promise">Not the best place. The best next move.</p>
  </div>;
}

function ScreenTwo({ scenario, note, selected, answers, setAnswer, next }: { scenario: Scenario; note: string; selected: string; answers: Answers; setAnswer: (key: string, value: string) => void; next: () => void }) {
  const summary = note.trim() ? [note.trim()] : scenario.summary;
  return <div className="screen-body screen-two"><section className="page-title"><p className="kicker">STATE CHECK</p><h1>我大概明白了</h1><p>不用重排整天，我们只确认此刻最重要的几件事。</p></section>
    <section className="understood-card"><span className="quote-mark">“</span><small>刚刚发生了什么</small>{summary.map((line) => <p key={line}>{line}</p>)}<div className="summary-tags"><span>{scenario.city}</span><span>{scenario.weather}</span><span>{scenario.mode}</span><span>{selected}</span></div></section>
    <div className="question-list">{questions.map((question) => <section className="mini-question" key={question.key}><div className="question-title"><span>{question.number}</span><h2>{question.title}</h2></div><div className="option-grid">{question.options.map((option) => <button key={option} className={answers[question.key] === option ? "selected" : ""} onClick={() => setAnswer(question.key, option)}>{option}<i /></button>)}</div></section>)}</div>
    <div className="context-read"><div><span>Place</span><b>{scenario.city}</b></div><i>×</i><div><span>Me</span><b>{scenario.mode}</b></div><i>×</i><div><span>Now</span><b>{scenario.time}</b></div></div>
    <p className="data-note"><span>✦</span> 我们会结合位置、时间、天气、同行状态和周边开放情况，只给你 2–3 个适合现在的选择。</p><button className="primary-cta" onClick={next}>看看接下来可以怎么过 <span>→</span></button>
  </div>;
}

function MoveVisual({ type }: { type: Move["visual"] }) {
  const labels: Record<Move["visual"], string> = { pause: "RESET", wander: "WANDER", spark: "DISCOVER", food: "REFUEL", view: "OPEN AIR", shelter: "STAY DRY", play: "PLAY" };
  return <div className={`move-visual ${type}`} aria-hidden="true"><span className="visual-orbit orbit-a" /><span className="visual-orbit orbit-b" /><b>{labels[type]}</b></div>;
}

function Serendipity({ level }: { level: Move["serendipity"] }) {
  return <div className="serendipity"><span>Serendipity</span><div aria-label={`惊喜程度 ${level} / 3`}>{[1, 2, 3].map((dot) => <i key={dot} className={dot <= level ? "active" : ""} />)}</div></div>;
}

function MoveCard({ move, index, featured, onSelect }: { move: Move; index: number; featured: boolean; onSelect: (move: Move) => void }) {
  const [saved, setSaved] = useState(false);
  return <article className={`move-card ${featured ? "featured" : ""}`}><div className="move-top"><div><span className="move-number">{String(index + 1).padStart(2, "0")} · {featured ? "BEST FIT NOW" : move.category.toUpperCase()}</span><span className="category">{move.category}</span><h2>{move.title}</h2></div><MoveVisual type={move.visual} /></div>
    <div className="move-facts"><div><small>Distance</small><b>{move.distance}</b></div><div><small>Effort</small><b>{move.effort}</b></div><div><small>Availability</small><b>{move.availability}</b></div></div>
    <div className="why"><small>WHY NOW</small><p>{move.whyNow}</p></div><Serendipity level={move.serendipity} />
    <div className="card-actions"><button className="move-cta" onClick={() => onSelect(move)}>{move.cta} <span>↗</span></button><button className="save-button" onClick={() => setSaved((value) => !value)}>{saved ? "已保存 ✓" : "保存一下"}</button></div>
  </article>;
}

function ScreenThree({ scenario, answers, groupIndex, setGroupIndex, choose, adjust }: { scenario: Scenario; answers: Answers; groupIndex: number; setGroupIndex: (index: number) => void; choose: (move: Move) => void; adjust: () => void }) {
  const [homePrompt, setHomePrompt] = useState(false);
  const stateTags = [answers.time, answers.pace, answers.energy];
  return <div className="screen-body screen-three"><section className="page-title recommendation-title"><p className="kicker">BEST NEXT MOVES FOR NOW</p><h1>接下来可以这样过</h1><p>不是附近榜单，也不是评分最高，<br />而是更适合此刻的几个动作。</p></section><div className="fit-strip"><span>此刻</span>{stateTags.map((tag) => <b key={tag}>{tag}</b>)}</div><div className="move-list">{scenario.moveSets[groupIndex].map((move, index) => <MoveCard key={move.id} move={move} index={index} featured={index === 0} onSelect={choose} />)}</div>
    <div className="secondary-actions"><button onClick={() => setGroupIndex(groupIndex === 0 ? 1 : 0)}><span>↻</span><div><b>换一组建议</b><small>保持当前状态，换一种可能</small></div><i>→</i></button><button onClick={adjust}><span>⌁</span><div><b>调整一下状态</b><small>时间、节奏或体力变了</small></div><i>→</i></button><button className="home-action" onClick={() => setHomePrompt(true)}><span>⌂</span><div><b>我现在想回住处了</b><small>结束今天，也可以是最好的下一步</small></div><i>→</i></button></div>
    {homePrompt && <div className="overlay" role="dialog" aria-modal="true" aria-label="回住处确认"><div className="home-sheet"><span className="sheet-icon">☾</span><p className="kicker">THAT’S OKAY, TOO.</p><h2>今天到这里也可以。</h2><p>要不要帮你看看回去最轻松的路线？</p><button className="primary-cta" onClick={() => setHomePrompt(false)}>看看轻松回去的路线 <span>→</span></button><button className="quiet-cta" onClick={() => setHomePrompt(false)}>我自己回去就好</button></div></div>}
  </div>;
}

function ScreenFour({ scenario, move, restart }: { scenario: Scenario; move: Move; restart: () => void }) {
  const [feedback, setFeedback] = useState(""); const [reason, setReason] = useState("");
  return <div className="screen-body screen-four"><section className="page-title"><p className="kicker">FEEDBACK LOOP</p><h1>这个建议适合<br />刚才的你吗？</h1><p className="english-sub">Help me get better next time.</p></section><section className="chosen-move"><small>你选择了 · {move.category}</small><div><span>✓</span><p>“{move.title}”</p></div></section><section className="feedback-block"><h2>这个建议和你刚才的状态匹配吗？</h2><div className="feedback-options">{[["很适合", "☺"], ["还可以", "◡"], ["不太适合", "—"]].map(([label, emoji]) => <button key={label} className={feedback === label ? "selected" : ""} onClick={() => { setFeedback(label); setReason(""); }}><span>{emoji}</span>{label}</button>)}</div></section>
    {feedback === "很适合" && <div className="learned-message"><span>✦</span><p>收到。{scenario.learning}</p></div>}
    {feedback === "还可以" && <div className="learned-message neutral"><span>↗</span><p>记下了。下次我会保留这个方向，但重新平衡体力、距离和惊喜程度。</p></div>}
    {feedback === "不太适合" && <section className="reason-block"><h2>哪里不太对？</h2><div className="chips reason-chips">{feedbackReasons.map((item) => <button key={item} className={reason === item ? "selected" : ""} onClick={() => setReason(item)}>{item}{reason === item && <b>✓</b>}</button>)}</div>{reason && <div className="reason-confirm">知道了，我会把“{reason}”记在这次判断里。</div>}</section>}
    <div className="final-actions"><button className="primary-cta" onClick={restart}>再问一个新的下一步 <span>→</span></button><button className="outline-cta" onClick={restart}>返回产品首页</button></div><p className="final-promise">Not the best place. The best next move.</p>
  </div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>(1); const [scenario, setScenario] = useState<Scenario>(scenarios[0]); const [selectedChange, setSelectedChange] = useState(scenarios[0].trigger); const [note, setNote] = useState(""); const [moveGroup, setMoveGroup] = useState(0); const [chosenMove, setChosenMove] = useState<Move>(scenarios[0].moveSets[0][0]); const [answers, setAnswers] = useState<Answers>(scenarios[0].answers);
  const activeScenario = useMemo(() => scenario, [scenario]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [screen, moveGroup, scenario]);
  const changeScenario = (next: Scenario) => { setScenario(next); setSelectedChange(next.trigger); setNote(""); setAnswers(next.answers); setMoveGroup(0); setChosenMove(next.moveSets[0][0]); };
  const goBack = () => setScreen((current) => Math.max(1, current - 1) as Screen); const choose = (move: Move) => { setChosenMove(move); setScreen(4); }; const restart = () => { setScreen(1); setSelectedChange(scenario.trigger); setNote(""); setMoveGroup(0); setAnswers(scenario.answers); };
  return <main className="prototype-shell"><section className={`screen screen-${screen}`}><ContextBar scenario={activeScenario} screen={screen} goBack={goBack} />{screen === 1 && <ScreenOne scenario={activeScenario} selected={selectedChange} setSelected={setSelectedChange} note={note} setNote={setNote} next={() => setScreen(2)} changeScenario={changeScenario} />}{screen === 2 && <ScreenTwo scenario={activeScenario} note={note} selected={selectedChange} answers={answers} setAnswer={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))} next={() => setScreen(3)} />}{screen === 3 && <ScreenThree scenario={activeScenario} answers={answers} groupIndex={moveGroup} setGroupIndex={setMoveGroup} choose={choose} adjust={() => setScreen(2)} />}{screen === 4 && <ScreenFour scenario={activeScenario} move={chosenMove} restart={restart} />}</section></main>;
}
