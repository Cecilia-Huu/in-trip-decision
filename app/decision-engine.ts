import type { Locale } from "./mock-data";

export type CurrentState = "tired" | "lessWalking" | "explore" | "spontaneous";
export type DecisionStrategy = "rest" | "explore" | "flexible" | "conservative";
export type MapMode = "search" | "navigate";
export type Coordinates = { latitude: number; longitude: number };

export type DecisionContext = {
  change: string;
  currentPlace: string;
  coordinates?: Coordinates;
  noAnchorKnown?: boolean;
  timeConstraint?: string;
  currentTime: string;
  currentLocalTime?: string;
  lessWalking?: boolean;
  indoors?: boolean;
  nextAnchor: { time: string; place: string; destination?: string } | null;
  currentState: CurrentState[];
  preferences: {
    travelMode?: "solo" | "withOthers";
    pace?: "slow" | "normal" | "active";
  };
};

export type DecisionStep = {
  label: string;
  title: string;
  detail: string;
  anchor?: boolean;
  category?: string;
  map?: { label: string; query: string; mode: MapMode; center?: Coordinates };
};

export type DecisionResult = {
  strategy: DecisionStrategy;
  title: string;
  summary: string;
  horizon: string;
  steps: DecisionStep[];
  why: string;
  evidence: string[];
  currentLocalTime: string;
  revisit?: string;
};

export type DecisionEngine = (context: DecisionContext, locale: Locale, steering?: CurrentState | Steering) => DecisionResult;


export type Steering = { intent: CurrentState; lessWalking: boolean; indoors: boolean; text: string };
export function readCurrentClock(now = new Date()) {
  return { currentTime:now.toISOString(), currentLocalTime:[now.getHours(),now.getMinutes()].map(n=>String(n).padStart(2,"0")).join(":") };
}
const toMinutes=(s:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?Number(s.slice(0,2))*60+Number(s.slice(3)):null;
export function parseSteeringText(text:string):Steering|null {
  const lessWalking=/(少走|不想走|不要走|别走|不走远|不想.*坐车|less walk|not.*walk far|stay close)/i.test(text);
  const explore=/(想.*(?:逛|玩)|继续.*(?:逛|看)|探索|explore|keep going)/i.test(text)&&!/(不想.*(?:逛|玩)|don't want to explore)/i.test(text);
  const indoors=/(下雨|室内|rain|indoors)/i.test(text);
  const rest=/(累|休息|睡|tired|rest|sleep|worn out)/i.test(text);
  const different=/(换个感觉|换一种|随性|随便走走|不想赶|different|change the feel|spontaneous)/i.test(text);
  const intent=explore?"explore":rest||lessWalking?"lessWalking":indoors||different?"spontaneous":null;
  return intent?{intent,lessWalking,indoors,text:text.trim()}:null;
}
export const localDecisionEngine:DecisionEngine=(context,locale,steering)=>{
  const zh=locale==="zh", tr=(cn:string,en:string)=>zh?cn:en;
  const steer=typeof steering==="string"?{intent:steering,lessWalking:steering==="lessWalking",indoors:false,text:""}:steering;
  const state=steer?.intent??context.currentState[0];
  const less=steer?.lessWalking??context.lessWalking??state==="lessWalking";
  const indoor=steer?.indoors||context.indoors||(/(下雨|raining)/i.test(context.change)&&!/(没有下雨|没下雨|not raining)/i.test(context.change));
  const sleep=!steer&&/(睡懒觉|睡一(?:会|觉)|补觉|想睡|困了|nap|sleep in)/i.test(context.change);
  const strategy:DecisionStrategy=indoor?"flexible":state==="explore"?"explore":state==="tired"||state==="lessWalking"||sleep?"rest":state==="spontaneous"?"flexible":"conservative";
  const currentLocalTime=context.currentLocalTime??readCurrentClock(new Date(context.currentTime)).currentLocalTime;
  const now=toMinutes(currentLocalTime)??0, anchor=context.nextAnchor;
  const target=anchor?toMinutes(anchor.time):null, gap=target===null?null:target-now;
  const passed=gap!==null&&gap<=0, soon=gap!==null&&gap>0&&gap<=60, unclear=Boolean(anchor)&&gap===null;
  const duration=gap!==null&&gap>60?Math.min(40,gap-60):40, end=now+duration, finish=now+80;
  const fmt=(n:number)=>(n>=1440?tr("次日 ","Tomorrow "):"")+String(Math.floor(n/60)%24).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
  const destination=anchor?anchor.destination||anchor.place.replace(/(已预订|预订|预约|晚餐|晚饭|\s*·\s*)/g," ").replace(/\b(dinner|reservation|reserved|in)\b/gi," ").replace(/\s+/g," ").trim():"";
  const hasDestination=Boolean(destination)&&!/^(火车|演出 \/|Train|Show \/ booking|演出 \/ 预约)$/.test(destination);
  const navigationTarget=/^navigli$/i.test(destination)?"Navigli, Milan":destination;
  const categories={
    cafe:{query:"cafes",name:tr("咖啡馆 / 面包店","Cafés / bakeries"),action:tr("找一家能坐下的咖啡馆或面包店休息","Sit down in a café or bakery"),cta:tr("在地图里找附近的咖啡馆","Find nearby cafés in Maps")},
    park:{query:"parks",name:tr("公园 / 街区 / 小店区域","Parks / streets / small shops"),action:less?tr("只在当前区域找公园或小店轻逛","Explore a park or small shops within this area"):tr("在附近公园、街区或小店区域轻逛","Explore a nearby park or local streets"),cta:tr("在地图里看看附近的公园","Find nearby parks in Maps")},
    indoor:{query:"shopping malls",name:tr("商场 / 室内公共空间","Malls / indoor public spaces"),action:tr("找一处商场或室内公共空间短暂停留","Pause in a mall or indoor public space"),cta:tr("在地图里找附近的商场","Find nearby malls in Maps")}
  };
  type Category=keyof typeof categories;
  const category:Category=strategy==="explore"?"park":strategy==="flexible"?"indoor":"cafe";
  const search=(key:Category):NonNullable<DecisionStep["map"]>=>({label:categories[key].cta,query:categories[key].query+(context.coordinates?"":" near "+context.currentPlace),mode:"search",center:context.coordinates});
  let title=sleep?tr("先睡一会儿，醒来再决定要不要出门。","Sleep first; decide whether to go out when you wake."):strategy==="rest"?tr("今天先不补大型景点，在附近坐下来休息。","Skip another major sight and sit down nearby."):strategy==="explore"?tr(less?"不跨区，在附近留一段随时能结束的探索。":"不补大型景点，只在附近轻逛一段。","Skip a major sight; explore close by."):strategy==="flexible"?tr("先放下景点清单，换成一段室内停留。","Put the sightseeing list aside for an indoor pause."):tr("不急着补大型景点，先坐一会儿，再轻逛。","Do not rush to replace a major sight. Sit first, then wander.");
  let summary=sleep?tr("先留约 "+duration+" 分钟休息；醒来后有精神再出门。","Leave about "+duration+" minutes to rest; go out only if you feel ready."):categories[category].action+tr("，先留约 "+duration+" 分钟。"," for about "+duration+" minutes.");
  const steps:DecisionStep[]=[];
  const transit:DecisionStep={label:tr(fmt(end)+" 后","After "+fmt(end)),title:hasDestination?tr("开始前往 "+destination,"Start toward "+destination):tr("先核对预约地址，再决定何时出发","Check the booking address before leaving"),detail:tr("这是预留移动窗口；先在地图确认路线，必要时提前结束上一段","A travel window, not an ETA. Check Maps and shorten the first step if needed."),...(hasDestination?{map:{label:tr("导航到 "+destination,"Navigate to "+destination),query:navigationTarget,mode:"navigate" as const}}:{})};
  if(soon||passed||unclear){
    title=passed?tr("先核对固定安排的时间，不再插入新活动。","Check the fixed plan’s time before adding anything."):unclear?tr("先核对安排是几点，不急着补景点。","Check the booking time before adding another sight."):tr("先不加新活动，把时间留给固定安排。","Add no new activity; keep this time for the fixed plan.");
    summary=passed?tr("设备时间已过 "+anchor!.time+"；先确认日期、时区或安排是否仍有效。","Your device clock is past "+anchor!.time+". Check the date, timezone and booking."):unclear?tr("你提供的时间还不能确定上午或下午，先不猜。","The supplied time does not establish AM or PM."):tr("距离 "+anchor!.time+" 不超过一小时，先确认路线；不能保证一定赶得上。","At most an hour until "+anchor!.time+"; check the route first. Arrival is not guaranteed.");
    steps.push({...transit,label:tr(fmt(now)+" 起","From "+fmt(now)),title:passed||unclear?tr("核对预约时间和路线","Check booking time and route"):transit.title});
  }else{
    steps.push({label:fmt(now)+"–"+fmt(end),title:sleep?tr("在原地睡一会儿 / 休息","Sleep or rest where you are"):categories[category].action,detail:sleep?tr("不用为了填满空档而出门","No need to go out just to fill time"):less?tr("只看当前区域；不为了换一家店跨区","Stay in this area; do not cross town for an alternative"):tr("先确认开放、座位和入场要求","Check opening, seating and entry requirements"),category:sleep?undefined:categories[category].name,...(sleep?{}:{map:search(category)})});
    if(anchor && gap !== null && gap <= 180)steps.push(transit);
    else{
      const next:Category=indoor?"indoor":category==="park"?"cafe":"park";
      steps.push({label:fmt(end)+"–"+fmt(finish),title:sleep?tr("如果醒来且有精神，再在附近轻逛","If awake and ready, explore close by"):next==="park"?tr("状态好一些，再在附近街区或公园轻逛","If you feel better, wander in nearby streets or a park"):next==="cafe"?tr("逛够了，在附近咖啡馆或面包店坐一会儿","After exploring, sit in a nearby café or bakery"):tr("如果还想停留，就留在同一室内区域","Stay in the same indoor area if you want more time"),detail:tr("可以不去；到时按状态决定","Optional; decide how you feel then"),category:categories[next].name,map:search(next)});
    }
  }
  if(anchor)steps.push({label:tr("固定安排","Fixed plan"),title:anchor.time+" "+anchor.place,detail:passed||unclear?tr("时间待核对 · 不自动改到明天","Time needs checking · not moved to tomorrow"):tr("原安排保留","Original plan kept"),anchor:true});
  const stateEvidence=sleep?tr("想睡一觉","Want to sleep"):state==="explore"?tr("还想继续逛","Want to explore"):state==="tired"?tr("有点累","Feeling tired"):less?tr("少走一点","Less walking"):null;
  const anchorEvidence=anchor?anchor.time+" "+anchor.place:context.noAnchorKnown?tr("没有固定安排","No fixed plan"):null;
  const evidence=[stateEvidence,anchorEvidence,less&&state==="explore"?tr("不要走太远","Stay close"):indoor?(/下雨|raining/i.test(context.change+" "+(steer?.text??""))?tr("提到下雨","Reported rain"):tr("想在室内","Prefer indoors")):context.coordinates?tr("已获取当前位置","Current location received"):context.currentPlace].filter((v):v is string=>Boolean(v)).slice(0,3);
  const schedule=anchor?tr("你有「"+anchor.time+" "+anchor.place+"」。","You have "+anchor.time+" "+anchor.place+". "):context.noAnchorKnown?tr("你没有固定安排。","You have no fixed plan. "):tr("你暂未提供固定安排。","No fixed plan was supplied. ");
  const reason=soon||passed||unclear?summary:sleep?tr("你想睡一觉，所以先不追加出门计划，醒来再看状态。","You want to sleep, so add no outing yet."):strategy==="explore"?tr("你还想逛"+(less?"但不想走远":"")+"，所以只在当前区域找公园或小店，不跨区补大型景点。","You still want to explore, so stay in this area for a park or small shops instead of a major sight."):strategy==="rest"?tr("你想降低体力负担，所以先找咖啡馆或面包店这类可以坐下的场所，不再补大型景点。","You want a lower-effort break, so look for seating in a café or bakery rather than a major sight."):indoor?tr("你提到了下雨或室内偏好，所以这段不安排户外活动。","You mentioned rain or an indoor preference, so leave outdoor activities out."):strategy==="flexible"?tr("你想换个感觉，所以从景点探索换成商场或室内公共空间短暂停留。","You want a different feel, so switch to a mall or indoor public space."):tr("先不新增预约或跨区赶场，用坐一会儿和附近散步接上空档。","Avoid new bookings and cross-town travel; connect the gap with a seat and a nearby walk.");
  return {strategy,title,summary,currentLocalTime,horizon:tr("设备本地时间 "+currentLocalTime+" · 建议时间窗口","Device local time "+currentLocalTime+" · suggested windows"),steps,why:schedule+reason,evidence,revisit:(!anchor || (gap !== null && gap > 180))?tr(fmt(finish)+" 后，再按当时状态决定下一段。","After "+fmt(finish)+", decide again based on how you feel."):undefined};
};

export function createMapLinks(query: string, mode: MapMode = "search", center?: Coordinates) {
  const encoded = encodeURIComponent(query);
  if (center && mode === "search") {
    const coordinate = `${center.latitude},${center.longitude}`;
    return [
      { id: "apple", label: "Apple Maps", href: `https://maps.apple.com/?q=${encoded}&sll=${encodeURIComponent(coordinate)}` },
      { id: "google", label: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} near ${coordinate}`)}` },
    ] as const;
  }
  if (mode === "navigate") {
    return [
      { id: "apple", label: "Apple Maps", href: `https://maps.apple.com/?daddr=${encoded}` },
      { id: "google", label: "Google Maps", href: `https://www.google.com/maps/dir/?api=1&destination=${encoded}` },
      { id: "amap", label: "高德地图", href: `https://uri.amap.com/search?keyword=${encoded}&callnative=1` },
    ] as const;
  }
  return [
    { id: "apple", label: "Apple Maps", href: `https://maps.apple.com/?q=${encoded}` },
    { id: "google", label: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${encoded}` },
    { id: "amap", label: "高德地图", href: `https://uri.amap.com/search?keyword=${encoded}&callnative=1` },
  ] as const;
}
