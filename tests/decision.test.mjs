import test from 'node:test';
import assert from 'node:assert/strict';
import { extractContextFromText, needsAnchorQuestion } from '../app/context-parser.ts';
import { localDecisionEngine, createMapLinks, readCurrentClock, parseSteeringText } from '../app/decision-engine.ts';
import { findLandmark, landmarks } from '../app/mock-data.ts';
import { requestCoordinates } from '../app/location.ts';
import { appendTranscript, getSpeechRecognitionConstructor, speechLanguage } from '../app/speech.ts';

const full = '我在米兰大教堂附近，博物馆今天没开，我已经走得好累了，晚上七点在 Navigli 吃饭。';
const context = (text = full) => {
  const p = extractContextFromText(text, 'zh');
  return { change:text, currentPlace:p.currentPlace || '米兰大教堂附近', currentTime:'2026-09-11T08:00:00Z', currentLocalTime:'17:20', nextAnchor:p.nextAnchor || null, noAnchorKnown:p.noAnchor, currentState:p.currentState ? [p.currentState] : [], preferences:{} };
};

test('Current local clock uses device hours/minutes, not UTC formatting', () => {
  const now=new Date(2026,8,13,10,15);
  assert.equal(readCurrentClock(now).currentLocalTime,'10:15');
  assert.equal(readCurrentClock(now).currentTime,now.toISOString());
});
test('17:20 with 19:00 anchor reserves a window without inventing travel ETA', () => {
  const result=localDecisionEngine(context(),'zh');
  assert.equal(result.steps[0].label,'17:20–18:00');
  assert.equal(result.steps[1].label,'18:00 后');
  assert.match(result.steps[0].title,/咖啡馆或面包店/);
  assert.match(result.steps[1].detail,/预留移动窗口/);
});
test('10:20 no anchor has two real clock windows and a reassessment note', () => {
  const result=localDecisionEngine({...context('突然多出时间'),currentLocalTime:'10:20',noAnchorKnown:true},'zh');
  assert.equal(result.steps.length,2);
  assert.equal(result.steps[0].label,'10:20–11:00');
  assert.equal(result.steps[1].label,'11:00–11:40');
  assert.match(result.revisit,/11:40/);
  assert.equal(result.steps[0].map.query,'cafes near 米兰大教堂附近');
  assert.equal(result.steps[1].map.query,'parks near 米兰大教堂附近');
});
test('Hotel sleep needs no state or anchor questionnaire', () => {
  const parsed=extractContextFromText('我在酒店，现在只想睡一觉。','zh');
  assert.equal(parsed.restAtHotel,true);
  assert.equal(needsAnchorQuestion(parsed),false);
});
test('Explore plus less walking preserves both intent and constraint', () => {
  const steering=parseSteeringText('我还想逛，但不要走太远。');
  assert.equal(steering.intent,'explore');
  assert.equal(steering.lessWalking,true);
  const next=localDecisionEngine(context(),'zh',steering);
  assert.equal(next.strategy,'explore');
  assert.match(next.steps[0].category,/公园/);
  assert.match(next.steps[0].map.query,/parks/);
  assert.match(next.why,/不想走远/);
  assert.equal(context().nextAnchor.time,'19:00');
  assert.equal(parseSteeringText('颜色改成蓝色'),null);
});
test('Imminent and elapsed anchors do not receive a fake forty-minute outing', () => {
  for(const currentLocalTime of ['18:30','19:20']) {
    const result=localDecisionEngine({...context(),currentLocalTime},'zh');
    assert.equal(result.steps.filter(s=>!s.anchor).length,1);
    assert.doesNotMatch(result.summary,/40 分钟/);
    assert.match(result.steps.at(-1).title,/19:00/);
  }
});
test('Windows cross midnight explicitly; distant anchors do not create a full-day plan', () => {
  const late=localDecisionEngine({...context('突然多出时间'),currentLocalTime:'23:40'},'zh');
  assert.equal(late.steps[0].label,'23:40–次日 00:20');
  const distant=localDecisionEngine({...context(),currentLocalTime:'10:20'},'zh');
  assert.equal(distant.steps[1].map.mode,'search');
  assert.equal(distant.steps[1].label,'11:00–11:40');
});
test('Only explicit rain or indoor preference changes to indoor categories', () => {
  const rain=localDecisionEngine({...context('下雨了'),noAnchorKnown:true},'zh');
  assert.equal(rain.strategy,'flexible');
  assert.equal(rain.steps[0].map.query,'shopping malls near 米兰大教堂附近');
  assert.equal(rain.steps[1].map.query,rain.steps[0].map.query);
  assert.equal(localDecisionEngine(context('没有下雨'),'zh').strategy,'conservative');
});

test('Complete sentence skips all questions and preserves the dinner', () => {
  const p = extractContextFromText(full, 'zh');
  assert.equal(p.currentPlace, '米兰大教堂附近');
  assert.equal(p.currentState, 'tired');
  assert.equal(p.nextAnchor.time, '19:00');
  assert.equal(p.nextAnchor.destination, 'Navigli');
  assert.equal(needsAnchorQuestion(p), false);
  const result = localDecisionEngine(context(), 'zh');
  assert.equal(result.strategy, 'rest');
  assert.equal(result.steps.length, 3);
  assert.match(result.steps[0].map.query, /米兰大教堂/);
  assert.doesNotMatch(result.steps[0].map.query, /Navigli/);
  assert.equal(result.steps[1].map.query, 'Navigli, Milan');
});
test('Dirty input asks place but does not require a full questionnaire', () => {
  const p = extractContextFromText('我服了，又关门了。', 'zh');
  assert.equal(p.currentPlace, undefined);
  assert.equal(needsAnchorQuestion(p), false);
  assert.match(localDecisionEngine(context('我服了，又关门了。'), 'zh').why, /暂未提供固定安排/);
});
test('Fatigue without a schedule asks an anchor question, explicit none skips it', () => {
  assert.equal(needsAnchorQuestion(extractContextFromText('博物馆没开，我走得好累。', 'zh')), true);
  const p = extractContextFromText('现在十点，我想睡懒觉。我就在酒店，也没有后面的安排。', 'zh');
  assert.equal(p.currentPlace, '酒店');
  assert.equal(p.timeConstraint, '十点');
  assert.equal(p.noAnchor, true);
  assert.equal(needsAnchorQuestion(p), false);
  const result = localDecisionEngine(context('现在十点，我想睡懒觉。我就在酒店，也没有后面的安排。'), 'zh');
  assert.match(result.title, /先睡一会儿/);
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps.some(s => s.anchor), false);
});
for (const [text, expected] of [['我腿快走断了。','tired'],['这么早回酒店又觉得亏。','explore'],['我真的不想再坐车了。','lessWalking'],['我今天就想随便走走。','spontaneous']]) {
  test('State: '+text, () => assert.equal(extractContextFromText(text, 'zh').currentState, expected));
}
for (const [text,time] of [['晚上七点有晚餐','19:00'],['六点要去看演出','六点'],['下午四点要赶火车','16:00']]) {
  test('Anchor: '+text, () => {
    const p=extractContextFromText(text,'zh');
    assert.equal(p.nextAnchor.time,time);
    assert.equal(p.currentPlace,undefined);
    assert.equal(needsAnchorQuestion(p),false);
    assert.equal(localDecisionEngine(context(text),'zh').steps.some(s=>s.map?.mode==='navigate'),false);
  });
}
test('Three steers change steps and search categories without changing anchor', () => {
  const ctx=context();
  const rest=localDecisionEngine(ctx,'zh','lessWalking');
  const explore=localDecisionEngine(ctx,'zh','explore');
  const other=localDecisionEngine(ctx,'zh','spontaneous');
  assert.notEqual(rest.steps[0].title,explore.steps[0].title);
  assert.notEqual(explore.steps[0].map.query,other.steps[0].map.query);
  assert.equal(rest.steps[2].title,explore.steps[2].title);
});
test('Coordinates remain coordinates and reach action-specific search links', () => {
  const coords={latitude:45.4642,longitude:9.19}; // Synthetic test coordinates, not user location.
  const result=localDecisionEngine({...context(),currentPlace:'',coordinates:coords},'zh');
  const action=result.steps[0].map;
  assert.equal(action.query,'cafes');
  assert.deepEqual(action.center,coords);
  assert.doesNotMatch(result.why,/米兰|Duomo/);
  const links=createMapLinks(action.query,action.mode,action.center);
  assert.equal(new URL(links[0].href).searchParams.get('sll'),'45.4642,9.19');
  assert.match(new URL(links[1].href).searchParams.get('query'),/cafes near 45.4642,9.19/);
  assert.equal(links.some(l=>l.id==='amap'),false);
});
test('Map input is encoded and does not inject URL parameters', () => {
  const query='cafe near A&B #1';
  assert.equal(new URL(createMapLinks(query)[0].href).searchParams.get('q'),query);
  assert.equal(new URL(createMapLinks('Navigli, Milan','navigate')[1].href).searchParams.get('destination'),'Navigli, Milan');
});
test('Location unsupported, denied, unavailable and timeout reject without a fake place', async () => {
  await assert.rejects(requestCoordinates(undefined));
  for(const code of [1,2,3]) await assert.rejects(requestCoordinates({getCurrentPosition(_success,error) { error(new Error(String(code))); }}));
});
test('Location success preserves coordinates only and requests low-cost positioning', async () => {
  let calls=0;
  const geo={getCurrentPosition(success,_error,options) { calls++; assert.equal(options.enableHighAccuracy,false); assert.equal(options.timeout,10000); success({coords:{latitude:45.4642,longitude:9.19}}); }};
  assert.equal(calls,0);
  assert.deepEqual(await requestCoordinates(geo),{latitude:45.4642,longitude:9.19});
  assert.equal(calls,1);
});
test('Voice support is feature-detected and unsupported browsers stay text-only', () => {
  class StandardRecognition {}
  class WebkitRecognition {}
  assert.equal(getSpeechRecognitionConstructor(undefined), null);
  assert.equal(getSpeechRecognitionConstructor({ SpeechRecognition:StandardRecognition }), StandardRecognition);
  assert.equal(getSpeechRecognitionConstructor({ webkitSpeechRecognition:WebkitRecognition }), WebkitRecognition);
  assert.equal(speechLanguage('zh'), 'zh-CN');
  assert.equal(speechLanguage('en'), 'en-US');
});
test('Final voice text appends naturally without submitting or replacing typed text', () => {
  assert.equal(appendTranscript('', '博物馆没开', 'zh'), '博物馆没开');
  assert.equal(appendTranscript('博物馆没开', '我走得有点累', 'zh'), '博物馆没开，我走得有点累');
  assert.equal(appendTranscript('The museum is closed.', 'I feel tired', 'en'), 'The museum is closed. I feel tired');
});
test('Lens aliases, unknown fallback and all three depths are retained', () => {
  for(const [name,id] of [['米兰大教堂','milanCathedral'],[' Milan Cathedral ','milanCathedral'],['Duomo di Milano','milanCathedral'],['塞维利亚大教堂','sevilleCathedral'],['圣家堂','sagradaFamilia']]) assert.equal(findLandmark(name)?.id,id);
  assert.equal(findLandmark('巴黎先贤祠'),null);
  for(const landmark of Object.values(landmarks)) for(const lang of ['zh','en']) {
    const content=landmark.content[lang].narratives;
    assert.equal(new Set(Object.values(content).map(n=>JSON.stringify(n))).size,3);
  }
});
