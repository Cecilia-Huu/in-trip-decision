"use client";

import { useEffect, useState, type FormEvent } from "react";
import { changeGroups, createCustomScenario, feedbackReasons, questions, scenarios, type Move, type Scenario } from "./mock-data";

type Screen = 1 | 2 | 3 | 4;
type Answers = Record<string, string>;

function ContextBar({ scenario, screen, goBack }: { scenario: Scenario | null; screen: Screen; goBack: () => void }) {
  const context = scenario ? [scenario.city, scenario.time, scenario.weather].filter(Boolean).join(" · ") : "In-trip Decision";
  const secondary = scenario ? [scenario.occasion, scenario.mode === "Solo" ? "Solo trip" : scenario.mode].filter(Boolean).join(" · ") : "旅途中即时决策";
  return <header className="context-bar">
    {screen > 1 ? <button className="back-button" onClick={goBack} aria-label="返回上一页">←</button> : <div className="brand-mark">ID</div>}
    <div className="context-copy"><strong>{scenario && "📍 "}{context}</strong><small>{secondary}</small></div>
    {scenario && <div className="progress-dots" aria-label={`第 ${screen} 步，共 4 步`}>{[1, 2, 3, 4].map((step) => <i key={step} className={step <= screen ? "active" : ""} />)}</div>}
  </header>;
}

function LocationPicker({ scenario, onSelect, onClear }: { scenario: Scenario | null; onSelect: (scenario: Scenario) => void; onClear: () => void }) {
  const [open, setOpen] = useState(!scenario); const [searching, setSearching] = useState(false); const [city, setCity] = useState(""); const [locating, setLocating] = useState(false); const [error, setError] = useState("");
  const select = (next: Scenario) => { onSelect(next); setOpen(false); setSearching(false); setError(""); };
  const useLocation = () => {
    if (!navigator.geolocation) { setError("当前浏览器无法获取位置，可以搜索城市。" ); return; }
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition(() => { select(createCustomScenario("当前位置")); setLocating(false); }, () => { setLocating(false); setError("没有获取到位置，可以搜索城市或进入 Demo。" ); }, { timeout: 8000 });
  };
  const submitCity = (event: FormEvent) => { event.preventDefault(); if (city.trim()) select(createCustomScenario(city.trim())); };
  if (scenario && !open) return <button className="change-location" onClick={() => setOpen(true)}><span>⌖</span> 更换地点或试试其他 Demo <i>→</i></button>;
  return <section className="location-picker"><div className="location-heading"><span>📍</span><div><h2>你现在在哪？</h2><p>先确定当前位置，再帮你判断下一步。</p></div>{scenario && <button onClick={() => setOpen(false)} aria-label="收起位置选择">×</button>}</div>
    <div className="location-actions"><button onClick={useLocation} disabled={locating}><span>⌖</span><b>{locating ? "正在获取位置…" : "使用当前位置"}</b><i>→</i></button><button onClick={() => setSearching((value) => !value)}><span>⌕</span><b>搜索城市</b><i>→</i></button><button className="demo-entry" onClick={() => select(scenarios[0])}><span>01</span><b>Try demo · Seville</b><i>→</i></button></div>
    {searching && <form className="city-search" onSubmit={submitCity}><input autoFocus value={city} onChange={(event) => setCity(event.target.value)} placeholder="输入城市，例如 Paris" aria-label="搜索城市" /><button disabled={!city.trim()}>确认</button></form>}
    <div className="more-demos"><span>More demos</span>{scenarios.slice(1).map((item) => <button key={item.id} onClick={() => select(item)}>{item.city}</button>)}</div>
    {error && <p className="location-error" role="alert">{error}</p>}
    {scenario && <button className="clear-location" onClick={() => { onClear(); setOpen(true); }}>清除当前位置</button>}
  </section>;
}

function ScreenOne({ scenario, selected, setSelected, note, setNote, next, changeScenario, clearScenario }: { scenario: Scenario | null; selected: string; setSelected: (value: string) => void; note: string; setNote: (value: string) => void; next: () => void; changeScenario: (scenario: Scenario) => void; clearScenario: () => void }) {
  const canContinue = Boolean(scenario && selected);
  return <div className="screen-body screen-one">
    <section className="intro-copy"><p className="kicker">IN-TRIP DECISION</p><h1>接下来去哪？<small>What’s Next?</small></h1><h2>计划变了，或者你变了。</h2><p>不用重新做攻略，先决定下一步。</p></section>
    <LocationPicker scenario={scenario} onSelect={changeScenario} onClear={clearScenario} />
    <div className="change-choices">{changeGroups.map((group) => <section className="choice-group" key={group.key}><div className="choice-heading"><span>{group.letter}</span><div><h3>{group.title}</h3><p>{group.description}</p></div></div><div className="chips">{group.options.map((item) => <button key={item} className={selected === item ? "selected" : ""} onClick={() => setSelected(item)}>{item}{selected === item && <b>✓</b>}</button>)}</div></section>)}</div>
    <label className="story-input"><span>或者直接告诉我发生了什么</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="比如：突然下雨了，但我还不想结束今天。" /></label>
    <button className="primary-cta" onClick={next} disabled={!canContinue}>{!scenario ? "先选择你的位置" : !selected ? "选择发生了什么" : "决定我的下一步"}<span>→</span></button>
    <p className="promise">Not the best place. The best next move.</p>
  </div>;
}

function timeCopy(value: string) { return value === "30 分钟左右" ? "大约半小时" : value === "1 小时左右" ? "大约一小时" : "两个小时以上"; }
function paceCopy(value: string) { return value === "慢一点" ? "想慢一点" : value === "继续逛逛" ? "还想继续逛逛" : value === "找地方坐坐" ? "想找地方坐坐" : "想来点特别的"; }
function stateTail(scenario: Scenario, selected: string) { if (scenario.weather === "Rainy" || selected === "突然下雨") return "也想先避开这场雨。"; if (scenario.id === "seville" || selected === "我累了" || selected === "不想走远") return "也不太想走远。"; return "也想让下一步轻松一点。"; }

function ScreenTwo({ scenario, selected, answers, setAnswer, next }: { scenario: Scenario; selected: string; answers: Answers; setAnswer: (key: string, value: string) => void; next: () => void }) {
  const subject = scenario.mode === "Friends" ? "你们" : "你";
  return <div className="screen-body screen-two"><section className="page-title compact-title"><p className="kicker">STATE CHECK</p><h1>我大概明白了</h1><p>今天不用赶，我们先找一个适合现在的下一步。</p></section>
    <p className="state-summary"><span>✦</span>{subject}现在还有{timeCopy(answers.time)}，{paceCopy(answers.pace)}，{stateTail(scenario, selected)}</p>
    <div className="question-list light-questions">{questions.slice(0, 2).map((question) => <section className="mini-question" key={question.key}><div className="question-title"><span>{question.number === "01" ? "A" : "B"}</span><h2>{question.title}</h2></div><div className="option-grid">{question.options.map((option) => <button key={option} className={answers[question.key] === option ? "selected" : ""} onClick={() => setAnswer(question.key, option)}>{question.key === "time" ? option.replace("30 分钟左右", "30 min").replace("1 小时左右", "1h").replace("2 小时以上", "2h+") : option.replace("继续逛逛", "继续逛")}<i /></button>)}</div></section>)}</div>
    <button className="primary-cta state-cta" onClick={next}>看看接下来可以怎么过 <span>→</span></button>
  </div>;
}

function MoveVisual({ type }: { type: Move["visual"] }) {
  const labels: Record<Move["visual"], string> = { pause: "RESET", wander: "WANDER", spark: "DISCOVER", food: "REFUEL", view: "OPEN AIR", shelter: "STAY DRY", play: "PLAY" };
  return <div className={`move-visual ${type}`} aria-hidden="true"><span className="visual-orbit orbit-a" /><span className="visual-orbit orbit-b" /><b>{labels[type]}</b></div>;
}

function Serendipity({ level }: { level: Move["serendipity"] }) { return <div className="serendipity"><span>Serendipity</span><div aria-label={`惊喜程度 ${level} / 3`}>{[1, 2, 3].map((dot) => <i key={dot} className={dot <= level ? "active" : ""} />)}</div></div>; }

function MoveCard({ move, index, featured, onSelect }: { move: Move; index: number; featured: boolean; onSelect: (move: Move) => void }) {
  const [saved, setSaved] = useState(false);
  return <article className={`move-card ${featured ? "featured" : ""}`}><div className="move-top"><div><span className="move-number">{String(index + 1).padStart(2, "0")} · {featured ? "BEST FIT NOW" : move.category.toUpperCase()}</span><span className="category">{move.category}</span><h2>{move.title}</h2></div><MoveVisual type={move.visual} /></div><div className="move-facts"><div><small>Distance</small><b>{move.distance}</b></div><div><small>Effort</small><b>{move.effort}</b></div><div><small>Availability</small><b>{move.availability}</b></div></div><div className="why"><small>WHY NOW</small><p>{move.whyNow}</p></div><Serendipity level={move.serendipity} /><div className="card-actions"><button className="move-cta" onClick={() => onSelect(move)}>{move.cta} <span>↗</span></button><button className="save-button" onClick={() => setSaved((value) => !value)}>{saved ? "已保存 ✓" : "保存一下"}</button></div></article>;
}

function ScreenThree({ scenario, answers, groupIndex, setGroupIndex, choose, adjust }: { scenario: Scenario; answers: Answers; groupIndex: number; setGroupIndex: (index: number) => void; choose: (move: Move) => void; adjust: () => void }) {
  const [homePrompt, setHomePrompt] = useState(false);
  return <div className="screen-body screen-three"><section className="page-title recommendation-title"><p className="kicker">BEST NEXT MOVES FOR NOW</p><h1>接下来可以这样过</h1><p>不是附近榜单，也不是评分最高，<br />而是更适合此刻的几个选择。</p></section><div className="fit-line"><span>{answers.time}</span><i>·</i><span>{answers.pace}</span></div><div className="move-list">{scenario.moveSets[groupIndex].map((move, index) => <MoveCard key={move.id} move={move} index={index} featured={index === 0} onSelect={choose} />)}</div><div className="secondary-actions"><button onClick={() => setGroupIndex(groupIndex === 0 ? 1 : 0)}><span>↻</span><div><b>换一组建议</b><small>保持当前状态，换一种可能</small></div><i>→</i></button><button onClick={adjust}><span>⌁</span><div><b>调整一下状态</b><small>时间或节奏变了</small></div><i>→</i></button><button className="home-action" onClick={() => setHomePrompt(true)}><span>⌂</span><div><b>我现在想回住处了</b><small>结束今天，也可以是最好的下一步</small></div><i>→</i></button></div>{homePrompt && <div className="overlay" role="dialog" aria-modal="true" aria-label="回住处确认"><div className="home-sheet"><span className="sheet-icon">☾</span><p className="kicker">THAT’S OKAY, TOO.</p><h2>今天到这里也可以。</h2><p>要不要帮你看看回去最轻松的路线？</p><button className="primary-cta" onClick={() => setHomePrompt(false)}>看看轻松回去的路线 <span>→</span></button><button className="quiet-cta" onClick={() => setHomePrompt(false)}>我自己回去就好</button></div></div>}</div>;
}

function ScreenFour({ scenario, move, restart }: { scenario: Scenario; move: Move; restart: () => void }) {
  const [feedback, setFeedback] = useState(""); const [reason, setReason] = useState("");
  return <div className="screen-body screen-four"><section className="page-title"><p className="kicker">FEEDBACK LOOP</p><h1>这个建议适合<br />刚才的你吗？</h1><p className="english-sub">Help me get better next time.</p></section><section className="chosen-move"><small>你选择了 · {move.category}</small><div><span>✓</span><p>“{move.title}”</p></div></section><section className="feedback-block"><h2>这个建议和你刚才的状态匹配吗？</h2><div className="feedback-options">{[["很适合", "☺"], ["还可以", "◡"], ["不太适合", "—"]].map(([label, emoji]) => <button key={label} className={feedback === label ? "selected" : ""} onClick={() => { setFeedback(label); setReason(""); }}><span>{emoji}</span>{label}</button>)}</div></section>{feedback === "很适合" && <div className="learned-message"><span>✦</span><p>收到。{scenario.learning}</p></div>}{feedback === "还可以" && <div className="learned-message neutral"><span>↗</span><p>记下了。下次我会保留这个方向，但重新平衡体力、距离和惊喜程度。</p></div>}{feedback === "不太适合" && <section className="reason-block"><h2>哪里不太对？</h2><div className="chips reason-chips">{feedbackReasons.map((item) => <button key={item} className={reason === item ? "selected" : ""} onClick={() => setReason(item)}>{item}{reason === item && <b>✓</b>}</button>)}</div>{reason && <div className="reason-confirm">知道了，我会把“{reason}”记在这次判断里。</div>}</section>}<div className="final-actions"><button className="primary-cta" onClick={restart}>再问一个新的下一步 <span>→</span></button><button className="outline-cta" onClick={restart}>返回产品首页</button></div><p className="final-promise">Not the best place. The best next move.</p></div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>(1); const [scenario, setScenario] = useState<Scenario | null>(null); const [selectedChange, setSelectedChange] = useState(""); const [note, setNote] = useState(""); const [moveGroup, setMoveGroup] = useState(0); const [chosenMove, setChosenMove] = useState<Move>(scenarios[0].moveSets[0][0]); const [answers, setAnswers] = useState<Answers>({ time: "1 小时左右", pace: "慢一点" });
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [screen, moveGroup, scenario]);
  const changeScenario = (next: Scenario) => { setScenario(next); setSelectedChange(next.trigger); setNote(""); setAnswers({ time: next.answers.time, pace: next.answers.pace }); setMoveGroup(0); setChosenMove(next.moveSets[0][0]); };
  const clearScenario = () => { setScenario(null); setSelectedChange(""); setNote(""); setAnswers({ time: "1 小时左右", pace: "慢一点" }); };
  const goBack = () => setScreen((current) => Math.max(1, current - 1) as Screen); const choose = (move: Move) => { setChosenMove(move); setScreen(4); }; const restart = () => { setScreen(1); setNote(""); setMoveGroup(0); if (scenario) setAnswers({ time: scenario.answers.time, pace: scenario.answers.pace }); };
  return <main className="prototype-shell"><section className={`screen screen-${screen}`}><ContextBar scenario={scenario} screen={screen} goBack={goBack} />{screen === 1 && <ScreenOne scenario={scenario} selected={selectedChange} setSelected={setSelectedChange} note={note} setNote={setNote} next={() => scenario && selectedChange && setScreen(2)} changeScenario={changeScenario} clearScenario={clearScenario} />}{screen === 2 && scenario && <ScreenTwo scenario={scenario} selected={selectedChange} answers={answers} setAnswer={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))} next={() => setScreen(3)} />}{screen === 3 && scenario && <ScreenThree scenario={scenario} answers={answers} groupIndex={moveGroup} setGroupIndex={setMoveGroup} choose={choose} adjust={() => setScreen(2)} />}{screen === 4 && scenario && <ScreenFour scenario={scenario} move={chosenMove} restart={restart} />}</section></main>;
}
