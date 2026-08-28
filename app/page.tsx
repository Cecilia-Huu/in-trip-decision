"use client";

import { useEffect, useMemo, useState } from "react";
import { changeGroups, demoNote, feedbackReasons, moveSets, questions, type Move } from "./mock-data";

type Screen = 1 | 2 | 3 | 4;
type Answers = Record<string, string>;

function ContextHeader({ screen, goBack }: { screen: Screen; goBack: () => void }) {
  return <header className="context-bar">
    {screen > 1 ? <button className="back-button" onClick={goBack} aria-label="返回上一页">←</button> : <div className="place-mark">SEV</div>}
    <div className="context-copy"><strong>Seville</strong><small>Christmas Day · Sunny · Solo</small></div>
    <div className="progress-dots" aria-label={`第 ${screen} 步，共 4 步`}>{[1, 2, 3, 4].map((step) => <i key={step} className={step <= screen ? "active" : ""} />)}</div>
  </header>;
}

function ScreenOne({ selected, setSelected, note, setNote, next }: { selected: string; setSelected: (value: string) => void; note: string; setNote: (value: string) => void; next: () => void }) {
  return <div className="screen-body screen-one">
    <div className="city-strip" aria-hidden="true"><div className="city-sun" /><div className="city-tower" /><div className="city-roof roof-one" /><div className="city-roof roof-two" /><span>37.3891° N</span></div>
    <section className="intro-copy"><p className="kicker">WHAT’S NEXT?</p><h1>接下来去哪？</h1><h2>今天的计划有变化吗？</h2><p>不是重新做一整套攻略，只是在计划变化时，帮你找到更适合现在的下一步。</p></section>
    {changeGroups.map((group) => <section className="choice-group" key={group.key}><div className="choice-heading"><span>{group.letter}</span><div><h3>{group.title}</h3><p>{group.description}</p></div></div><div className="chips">{group.options.map((item) => <button key={item} className={selected === item ? "selected" : ""} onClick={() => { setSelected(item); if (item === "景点关门了") setNote(demoNote); }}>{item}{selected === item && <b>✓</b>}</button>)}</div></section>)}
    <label className="story-input"><span>或者，直接告诉我发生了什么</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="比如：很多地方圣诞节不开，但我还不想回去。" /></label>
    <button className="primary-cta" onClick={next}>继续 <span>→</span></button>
    <p className="promise">Not the best place. The best next move.</p>
  </div>;
}

function ScreenTwo({ answers, setAnswer, next }: { answers: Answers; setAnswer: (key: string, value: string) => void; next: () => void }) {
  return <div className="screen-body screen-two"><section className="page-title"><p className="kicker">A QUICK CHECK-IN</p><h1>我大概明白了</h1><p>今天不用赶，我们先找一个适合现在的下一步。</p></section>
    <section className="understood-card"><span className="quote-mark">“</span><small>你刚刚说</small><p>很多地方圣诞节不开，<br />但今天天气很好，<br />你还不想结束今天，<br />想慢慢感受一下这座城市。</p><div className="summary-tags"><span>Solo</span><span>Sunny</span><span>Plan changed</span><span>Want to slow down</span></div></section>
    <div className="question-list">{questions.map((question) => <section className="mini-question" key={question.key}><div className="question-title"><span>{question.number}</span><h2>{question.title}</h2></div><div className="option-grid">{question.options.map((option) => <button key={option} className={answers[question.key] === option ? "selected" : ""} onClick={() => setAnswer(question.key, option)}>{option}<i /></button>)}</div></section>)}</div>
    <p className="data-note"><span>✦</span> 我们会结合位置、时间、天气和周边开放情况，只给你 2–3 个适合现在的选择。</p><button className="primary-cta" onClick={next}>看看接下来可以怎么过 <span>→</span></button>
  </div>;
}

function MoveVisual({ type }: { type: Move["visual"] }) {
  return <div className={`move-visual ${type}`} aria-hidden="true"><span className="visual-sun" /><span className="visual-line line-a" /><span className="visual-line line-b" /><b>{type === "cafe" ? "CAFÉ · SOL" : type === "walk" ? "CALLE" : type === "surprise" ? "HOY" : type === "garden" ? "JARDÍN" : type === "river" ? "RÍO" : "TAPAS"}</b></div>;
}

function MoveCard({ move, onSelect }: { move: Move; onSelect: (move: Move) => void }) {
  return <article className={`move-card ${move.id === 1 ? "featured" : ""}`}><div className="move-top"><div><span className="move-number">{String(move.id > 3 ? move.id - 3 : move.id).padStart(2, "0")} · {move.label}</span><h2>{move.title}</h2></div><MoveVisual type={move.visual} /></div><div className="move-meta">{move.meta.map((item) => <span key={item}>{item}</span>)}</div><div className="why"><small>为什么适合现在</small><p>{move.reason}</p></div><div className="card-actions"><button className="move-cta" onClick={() => onSelect(move)}>{move.cta} <span>↗</span></button>{move.id === 1 && <button className="save-button" onClick={(event) => { const button = event.currentTarget; button.textContent = button.textContent === "已保存 ✓" ? "保存一下" : "已保存 ✓"; }}>保存一下</button>}</div></article>;
}

function ScreenThree({ setIndex, groupIndex, choose, adjust }: { setIndex: (index: number) => void; groupIndex: number; choose: (move: Move) => void; adjust: () => void }) {
  const [homePrompt, setHomePrompt] = useState(false);
  return <div className="screen-body screen-three"><section className="page-title recommendation-title"><p className="kicker">BEST NEXT MOVES FOR NOW</p><h1>接下来可以这样过</h1><p>不是最热门，也不是评分最高，<br />而是现在更适合你的几个选择。</p></section><div className="fit-strip"><span>此刻的你</span><b>2h+</b><b>想慢一点</b><b>低体力</b></div><div className="move-list">{moveSets[groupIndex].map((move) => <MoveCard key={move.id} move={move} onSelect={choose} />)}</div>
    <div className="secondary-actions"><button onClick={() => setIndex(groupIndex === 0 ? 1 : 0)}><span>↻</span><div><b>换一组建议</b><small>看看另一种过法</small></div><i>→</i></button><button onClick={adjust}><span>⌁</span><div><b>调整一下状态</b><small>时间、节奏或体力变了</small></div><i>→</i></button><button className="home-action" onClick={() => setHomePrompt(true)}><span>⌂</span><div><b>我现在想回住处了</b><small>结束今天，也可以是最好的下一步</small></div><i>→</i></button></div>
    {homePrompt && <div className="overlay" role="dialog" aria-modal="true" aria-label="回住处确认"><div className="home-sheet"><span className="sheet-icon">☾</span><p className="kicker">THAT’S OKAY, TOO.</p><h2>今天到这里也可以。</h2><p>要不要帮你看看回去最轻松的路线？</p><button className="primary-cta" onClick={() => setHomePrompt(false)}>看看轻松回去的路线 <span>→</span></button><button className="quiet-cta" onClick={() => setHomePrompt(false)}>我自己回去就好</button></div></div>}
  </div>;
}

function ScreenFour({ move, restart }: { move: Move; restart: () => void }) {
  const [feedback, setFeedback] = useState(""); const [reason, setReason] = useState("");
  return <div className="screen-body screen-four"><section className="page-title"><p className="kicker">ONE LAST THING</p><h1>这个建议适合<br />刚才的你吗？</h1><p className="english-sub">Help me get better next time.</p></section><section className="chosen-move"><small>你选择了</small><div><span>✓</span><p>“{move.title}”</p></div></section><section className="feedback-block"><h2>这个建议和你刚才的状态匹配吗？</h2><div className="feedback-options">{[["很适合", "☺"], ["还可以", "◡"], ["不太适合", "—"]].map(([label, emoji]) => <button key={label} className={feedback === label ? "selected" : ""} onClick={() => { setFeedback(label); setReason(""); }}><span>{emoji}</span>{label}</button>)}</div></section>
    {feedback === "很适合" && <div className="learned-message"><span>✦</span><p>收到。下次你说“今天想慢一点”时，我会更偏向这种轻一点的节奏。</p></div>}
    {feedback === "还可以" && <div className="learned-message neutral"><span>↗</span><p>记下了。下次我会保留这种轻松感，但再多给一点新鲜感。</p></div>}
    {feedback === "不太适合" && <section className="reason-block"><h2>哪里不太对？</h2><div className="chips reason-chips">{feedbackReasons.map((item) => <button key={item} className={reason === item ? "selected" : ""} onClick={() => setReason(item)}>{item}{reason === item && <b>✓</b>}</button>)}</div>{reason && <div className="reason-confirm">知道了，我会把“{reason}”记在这次判断里。</div>}</section>}
    <div className="final-actions"><button className="primary-cta" onClick={restart}>继续记录我的这一天 <span>→</span></button><button className="outline-cta" onClick={restart}>再问一个新的下一步</button></div><p className="final-promise">不是推荐最好的地方，而是找到此刻最合适的下一步。</p>
  </div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>(1); const [selectedChange, setSelectedChange] = useState("景点关门了"); const [note, setNote] = useState(demoNote); const [moveGroup, setMoveGroup] = useState(0); const [chosenMove, setChosenMove] = useState<Move>(moveSets[0][0]);
  const initialAnswers = useMemo(() => Object.fromEntries(questions.map((question) => [question.key, question.initial])), []); const [answers, setAnswers] = useState<Answers>(initialAnswers);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [screen, moveGroup]);
  const goBack = () => setScreen((current) => Math.max(1, current - 1) as Screen); const choose = (move: Move) => { setChosenMove(move); setScreen(4); };
  const restart = () => { setScreen(1); setSelectedChange("景点关门了"); setNote(demoNote); setMoveGroup(0); setAnswers(initialAnswers); };
  return <main className="prototype-shell"><section className={`screen screen-${screen}`}><ContextHeader screen={screen} goBack={goBack} />{screen === 1 && <ScreenOne selected={selectedChange} setSelected={setSelectedChange} note={note} setNote={setNote} next={() => setScreen(2)} />}{screen === 2 && <ScreenTwo answers={answers} setAnswer={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))} next={() => setScreen(3)} />}{screen === 3 && <ScreenThree groupIndex={moveGroup} setIndex={setMoveGroup} choose={choose} adjust={() => setScreen(2)} />}{screen === 4 && <ScreenFour move={chosenMove} restart={restart} />}</section></main>;
}
