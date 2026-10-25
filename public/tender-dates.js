// Source chronology only. Discovery, checks, deadlines and comments are never publication fallbacks.
const DAY=86400000;
const validDay=value=>{const m=typeof value==='string'&&value.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return false;const [,y,mo,d]=m;return +y>=1000&&+mo>=1&&+mo<=12&&+d>=1&&+d<=new Date(Date.UTC(+y,+mo,0)).getUTCDate();};
export function calendarDay(value,timeZone='Europe/Moscow'){
 const time=typeof value==='number'?value:Date.parse(value);if(!Number.isFinite(time))return null;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));
 return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
}
export function sourceDate({at=null,date=null,raw=null}={},timeZone='Europe/Moscow'){
 for(const value of [at,raw]){
  const m=typeof value==='string'&&value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/);
  if(m&&validDay(m[1])&&+m[2]<24&&+m[3]<60&&+m[4]<60&&(!m[6]||+m[6]<=14&&+m[7]<60&&(+m[6]<14||+m[7]===0))&&Number.isFinite(Date.parse(value))){const timestamp=Date.parse(value);return {known:true,day:calendarDay(timestamp,timeZone),timestamp,utc:new Date(timestamp).toISOString(),raw:value,precision:'instant'};}
 }
 for(const value of [date,raw,at]){
  if(validDay(value))return {known:true,day:value,raw:value,precision:'date',timestamp:null,utc:null};
  const m=typeof value==='string'&&value.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if(m&&validDay(`${m[3]}-${m[2]}-${m[1]}`)&&(!m[4]||+m[4]<24&&+m[5]<60&&(!m[6]||+m[6]<60)))return {known:true,day:`${m[3]}-${m[2]}-${m[1]}`,raw:value,precision:m[4]?'local_time':'date',timestamp:null,utc:null};
 }
 return {known:false,day:null,timestamp:null,utc:null,raw:raw||at||date||null,precision:'unknown'};
}
export function publication(record,timeZone='Europe/Moscow'){
 // Historical NVM v2 put the start of acceptance in source_published_raw.
 // Keep that stored fact untouched, but never present it as a publication date.
 const legacyNvm=record.source_id==='gk_nvm'&&!record.field_provenance?.publication_date;
 if(legacyNvm)return {...sourceDate(),reason:'publication_not_provided_separately'};
 return sourceDate({at:record.source_published_at,date:record.source_published_date,raw:record.source_published_raw},timeZone);
}
export function acceptanceStart(record,timeZone='Europe/Moscow'){
 return sourceDate({at:record.source_acceptance_start_at,date:record.source_acceptance_start_date,raw:record.source_acceptance_start_raw||record.source_fields?.['Дата начала приема заявок']||record.source_fields?.['Дата начала приёма заявок']},timeZone);
}
const formatDay=day=>day.split('-').reverse().join('.');
export function dateLabel(value,timeZone='Europe/Moscow'){
 if(!value.known)return 'неизвестна'+(value.raw?' · исходное значение: '+value.raw:'');
 if(value.precision==='instant')return new Intl.DateTimeFormat('ru-RU',{timeZone,dateStyle:'short',timeStyle:'short'}).format(new Date(value.timestamp))+' ('+timeZone+')';
 if(value.precision==='local_time')return value.raw+' · часовой пояс не указан';
 return formatDay(value.day)+' · время и часовой пояс не указаны';
}
export function chronology(record,timeZone='Europe/Moscow'){
 const pub=publication(record,timeZone),start=acceptanceStart(record,timeZone);
 return [
  {key:'publication',label:'Опубликовано источником',value:dateLabel(pub,timeZone)},
  {key:'acceptance',label:'Начало приёма заявок',value:dateLabel(start,timeZone)},
  {key:'discovered',label:'Впервые обнаружено TSC',value:dateLabel(sourceDate({at:record.first_seen_at},timeZone),timeZone)},
  {key:'observed',label:'Последнее наблюдение TSC',value:dateLabel(sourceDate({at:record.last_seen_at},timeZone),timeZone)},
  {key:'checked',label:'Проверено TSC',value:dateLabel(sourceDate({at:record.checked_at},timeZone),timeZone)},
  {key:'source_updated',label:'Изменено источником',value:dateLabel(sourceDate({at:record.source_updated_at},timeZone),timeZone)}
 ];
}
const shiftDay=(day,days)=>new Date(Date.parse(day+'T12:00:00Z')+days*DAY).toISOString().slice(0,10);
export function publicationWindow({period='all',from='',to='',now=Date.now(),timeZone='Europe/Moscow'}={}){
 const today=calendarDay(now,timeZone);
 if(period==='today')return {from:today,to:today};
 if(period==='yesterday'){const day=shiftDay(today,-1);return {from:day,to:day};}
 if(period==='7days')return {from:shiftDay(today,-6),to:today};
 if(period==='range'){
  if(!validDay(from)||!validDay(to))return {error:'Укажите обе даты диапазона.'};
  if(from>to)return {error:'Дата «с» должна быть не позже даты «по».'};
  return {from,to};
 }
 return {from:null,to:null};
}
export function matchesPublication(record,{unknown='include',...options}={}){
 const value=publication(record,options.timeZone);
 if(unknown==='only')return !value.known;
 const window=publicationWindow(options);if(window.error)return false;
 if(!value.known)return unknown==='include';
 return (!window.from||value.day>=window.from)&&(!window.to||value.day<=window.to);
}
export function comparePublication(a,b,timeZone='Europe/Moscow'){
 const x=publication(a,timeZone),y=publication(b,timeZone);
 if(x.known!==y.known)return x.known?-1:1;
 if(x.known){const day=y.day.localeCompare(x.day);if(day)return day;
  // Precision groups give stable ordering without inventing midnight for date-only data.
  const rank={instant:0,local_time:1,date:2};const precision=rank[x.precision]-rank[y.precision];if(precision)return precision;
  if(x.timestamp!==null&&y.timestamp!==null&&x.timestamp!==y.timestamp)return y.timestamp-x.timestamp;
  if(x.precision==='local_time'&&x.raw!==y.raw)return y.raw.localeCompare(x.raw);
 }
 return String(a.id).localeCompare(String(b.id));
}
export function currentState(record,now=Date.now()){
 const age=now-Date.parse(record.checked_at),stale=!Number.isFinite(age)||age<0||age>DAY;
 const deadline=sourceDate({at:record.deadline?.utc}),expired=deadline.timestamp!==null&&deadline.timestamp<=now;
 let status=record.source_status?.normalized||'unknown';if(status==='open'&&expired)status='deadline_passed';
 const pub=publication(record),future=pub.timestamp!==null&&pub.timestamp>now+300000;
 const active=status==='open'&&record.procurement_kind!=='request_for_price'&&record.alert_state!=='HOLD'&&!record.source_archived&&!stale&&record.verification==='detail_verified'&&deadline.timestamp!==null&&!future;
 return {stale,status,active};
}
export function matchesActivity(record,mode='all',now=Date.now()){
 const state=currentState(record,now),closed=record.source_archived||['completed','cancelled','evaluation','deadline_passed'].includes(state.status);
 if(mode==='open')return state.status==='open'&&!record.source_archived;
 if(mode==='verified')return state.active;
 if(mode==='closed')return !!closed;
 if(mode==='review')return !closed&&!state.active;
 return true;
}

// Submission deadline only. Missing time/zone never becomes a fabricated countdown.
export function deadlineSortGroup(record,now=Date.now()){
 const time=sourceDate({at:record.deadline?.utc}).timestamp,status=record.source_status?.normalized;
 const closed=record.source_archived||['completed','cancelled','evaluation'].includes(status)||(time!==null&&time<=now);
 if(closed)return {rank:3,time};
 if(status==='open')return {rank:time===null?1:0,time};
 return {rank:2,time};
}
export function compareTimeRemaining(a,b,{now=Date.now(),timeZone='Europe/Moscow'}={}){
 const x=deadlineSortGroup(a,now),y=deadlineSortGroup(b,now);
 if(x.rank!==y.rank)return x.rank-y.rank;
 if((x.time===null)!==(y.time===null))return x.time===null?1:-1;
 if(x.time!==null&&y.time!==null&&x.time!==y.time)return y.time-x.time;
 return comparePublication(a,b,timeZone);
}
