import { useEffect, useRef, useState, type FormEvent } from "react";
import { extractContextFromText, needsAnchorQuestion, type ParsedContext } from "./context-parser";
import type { Coordinates, DecisionContext } from "./decision-engine";
import type { Locale } from "./mock-data";
import { requestCoordinates, resolveDecisionLocation } from "./location";
import { readCurrentClock } from "./decision-engine";
import { GooseProcessing } from "./goose-state";
import { VoiceInput } from "./voice-input";

const words = {
  zh: { hero:"告诉我，现在怎么啦？", label:"发生什么了？", try:"试试这样说", placeholder:"比如：博物馆没开，我已经走得有点累了……", chips:["原计划去不了了","突然多出时间","今天不想赶了"], submit:"看看下一步 →", missing:"先说说发生了什么。", location:"现在从哪里开始？", locationHint:"大概位置就可以。", locate:"📍 使用当前位置", locating:"正在获取位置…", or:"或", locationLabel:"位置", place:"输入附近的地点、地标或地址……", failed:"没找到你的位置。", acquired:"✓ 已获取当前位置", acquiredHint:"位置已获取，你也可以补充一个附近地点。", continue:"继续 →", anchor:"接下来有必须赶到的安排吗？", anchorHint:"比如预约的晚餐、演出、车次。没有也完全没关系。", none:"没有固定安排", add:"＋ 添加安排", time:"时间", plan:"安排 / 地点", invalid:"请填写有效时间和安排名称。", back:"修改刚才的情况" },
  en: { hero:"Tell me—what’s going on?", label:"What happened?", try:"Try saying", placeholder:"For example: The museum is closed and I’m getting tired…", chips:["The plan fell through","Time opened up","No more rushing today"], submit:"See what’s next →", missing:"Tell me what happened first.", location:"Where are you starting from?", locationHint:"A rough area is enough.", locate:"📍 Use current location", locating:"Getting your location…", or:"or", locationLabel:"Location", place:"Search or enter a place, landmark or address…", failed:"Couldn’t find your location.", acquired:"✓ Current location detected", acquiredHint:"Location detected. You can also add a nearby place.", continue:"Continue →", anchor:"Anything you need to get to next?", anchorHint:"A dinner booking, a show, a train. No fixed plan is fine too.", none:"No fixed plan", add:"＋ Add a plan", time:"Time", plan:"Plan / place", invalid:"Add a valid time and the plan name.", back:"Edit what you said" },
} as const;

type Stage = "input" | "location" | "anchor" | "processing";
type GeoState = "idle" | "pending" | "success" | "error";

export function DecisionForm({ locale, initialContext, onDecide }: { locale: Locale; initialContext: DecisionContext | null; onDecide: (context: DecisionContext) => void }) {
  const t = words[locale];
  const [change, setChange] = useState(initialContext?.change ?? "");
  const [stage, setStage] = useState<Stage>("input");
  const [parsed, setParsed] = useState<ParsedContext>({ noAnchor:false });
  const [place, setPlace] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates>();
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [addAnchor, setAddAnchor] = useState(false);
  const [anchorTime, setAnchorTime] = useState("");
  const [anchorPlace, setAnchorPlace] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState<DecisionContext | null>(null);
  const requestId = useRef(0);
  const question = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => { requestId.current += 1; }, []);
  useEffect(() => { if (stage !== "input") question.current?.focus(); }, [stage]);

  const finish = (data: ParsedContext, location: string, coords?: Coordinates) => {
    const resolvedLocation = resolveDecisionLocation(location, coords);
    setReady({ change:change.trim(), ...resolvedLocation, ...readCurrentClock(), lessWalking:data.lessWalking, indoors:data.indoors, timeConstraint:data.timeConstraint, nextAnchor:data.nextAnchor ?? null, noAnchorKnown:data.noAnchor, currentState:data.currentState ? [data.currentState] : [], preferences:initialContext?.preferences ?? {} });
    setStage("processing");
  };
  const advance = (data: ParsedContext, location: string, coords?: Coordinates) => {
    setError("");
    if (!location && !coords) { setStage("location"); return; }
    if (needsAnchorQuestion(data)) { setStage("anchor"); return; }
    finish(data, location, coords);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (stage === "input") {
      if (!change.trim()) { setError(t.missing); return; }
      const data = extractContextFromText(change, locale);
      setAddAnchor(false); setAnchorTime(""); setAnchorPlace("");
      // Carry manually supplied context only when the sentence itself is unchanged.
      const same = initialContext?.change === change.trim();
      const location = data.currentPlace || (same ? initialContext.currentPlace : "");
      const coords = !data.currentPlace && same ? initialContext.coordinates : undefined;
      if (same && !data.nextAnchor && initialContext.nextAnchor) data.nextAnchor = initialContext.nextAnchor;
      if (same && initialContext.noAnchorKnown) data.noAnchor = true;
      setParsed(data); setPlace(location); setCoordinates(coords); setGeoState(coords ? "success" : "idle");
      advance(data, location, coords);
    } else if (stage === "location") {
      if (!place.trim() && !coordinates) return;
      advance(parsed, place.trim(), coordinates);
    } else if (stage === "anchor" && addAnchor) {
      const time = anchorTime.trim().replace(/^(\d{2})(\d{2})$/, "$1:$2");
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !anchorPlace.trim()) { setError(t.invalid); return; }
      const data = { ...parsed, nextAnchor:{ time, place:anchorPlace.trim() } };
      finish(data, place, coordinates);
    }
  };
  const locate = () => {
    const id = ++requestId.current;
    setCoordinates(undefined); setGeoState("pending");
    requestCoordinates(navigator.geolocation).then(position => {
      if (id !== requestId.current) return;
      setCoordinates(position);
      setGeoState("success");
    }).catch(() => { if (id === requestId.current) setGeoState("error"); });
  };
  if (stage === "processing" && ready) return <GooseProcessing locale={locale} onComplete={() => onDecide(ready)} />;

  return <form className={`decision-form progressive-form app-screen${stage === "input" ? " home-screen" : ""}`} onSubmit={submit} noValidate>
    {stage === "input" ? <><section className="home-hero"><img className="walking-goose" src={import.meta.env.BASE_URL + "assets/goose-walking.svg"} alt="" width="210" height="140" /><p>{t.hero}</p></section><fieldset className="form-section"><legend>{t.label}</legend><VoiceInput locale={locale} value={change} onChange={setChange} placeholder={t.placeholder} ariaLabel={t.label} /><small className="example-label">{t.try}</small><div className="chip-row">{t.chips.map(chip => <button type="button" key={chip} className={change === chip ? "selected" : ""} onClick={() => setChange(chip)}>{chip}</button>)}</div></fieldset><button className="primary-action" type="submit">{t.submit}</button></> : <>
      <p className="input-recap">{change}</p>
      <section className="context-question" aria-labelledby="context-question">
        <h2 id="context-question" ref={question} tabIndex={-1}>{stage === "location" ? t.location : t.anchor}</h2>
        {stage === "anchor" ? <p>{t.anchorHint}</p> : null}
        {stage === "location" ? <>
          <div className={`location-goose${geoState === "error" ? " is-confused" : ""}`} aria-hidden="true"><img src={import.meta.env.BASE_URL + `assets/${geoState === "error" ? "goose-confused" : "goose-location"}.svg`} alt="" width="148" height="116" /></div>
          <button className="primary-action location-use-current" type="button" disabled={geoState === "pending"} onClick={locate}>{geoState === "pending" ? t.locating : t.locate}</button>
          {geoState === "success" ? <div className="location-status is-success" role="status"><strong>{t.acquired}</strong><small>{t.acquiredHint}</small></div> : null}
          {geoState === "error" ? <div className="location-status is-error" role="status"><strong>{t.failed}</strong></div> : null}
          <div className="location-divider" aria-hidden="true"><span>{t.or}</span></div>
          <label className="manual-location"><span>{t.locationLabel}</span><span className="location-input"><b aria-hidden="true">⌖</b><input autoComplete="off" value={place} onChange={e => setPlace(e.target.value)} placeholder={t.place} /></span><small>{t.locationHint}</small></label>
          <button className="primary-action location-continue" type="submit" disabled={!place.trim() && !coordinates}>{t.continue}</button>
        </> : <><button className="secondary-action" type="button" onClick={() => finish({ ...parsed, noAnchor:true }, place, coordinates)}>{t.none}</button>{!addAnchor ? <button className="text-action" type="button" onClick={() => setAddAnchor(true)}>{t.add}</button> : <><div className="anchor-fields"><label><span>{t.time}</span><input type="text" inputMode="numeric" placeholder="19:00" value={anchorTime} onChange={e => setAnchorTime(e.target.value)} /></label><label><span>{t.plan}</span><input value={anchorPlace} onChange={e => setAnchorPlace(e.target.value)} placeholder="Navigli" /></label></div><button className="primary-action" type="submit">{t.continue}</button></>}</>}
      </section><button className="text-action edit-sentence" type="button" onClick={() => { requestId.current += 1; setStage("input"); setError(""); }}>{t.back}</button>
    </>}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
  </form>;
}
