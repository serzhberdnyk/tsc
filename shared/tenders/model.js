import {createHash} from 'node:crypto';
export const clean = x => String(x ?? '').replace(/\s+/g,' ').trim();
export function textFromHtml(html) {return clean(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'));}
export function parseDate(raw) {
 if(!raw) return {raw:null,utc:null,timezone:null,error:'missing'};
 // No machine-local timezone inference; invalid calendar dates must not roll over.
 const m=String(raw).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
 if(!m) return {raw,utc:null,timezone:null,error:'timezone_or_format_unknown'};
 const [y,mo,d,h,mi,se]=m.slice(1,7).map(Number);
 if(mo<1||mo>12||d<1||d>new Date(Date.UTC(y,mo,0)).getUTCDate()||h>23||mi>59||se>59||!Number.isFinite(Date.parse(raw)))return {raw,utc:null,timezone:null,error:'invalid_date'};
 return {raw,utc:new Date(raw).toISOString(),timezone:m[7]==='Z'?'UTC':m[7],error:null};
}
export function money(raw,currency=null) {
 if(raw===null||raw===undefined||raw==='')return {amount:null,currency,raw:null};
 const n=typeof raw==='number'?raw:Number(String(raw).replace(/[\s\u00a0]/g,'').replace(',','.'));
 return {amount:Number.isFinite(n)&&n>=0?n:null,currency,raw};
}
const topics=[['LED / видеоэкраны',/(?:\bled\b|видеоэкран|светодиодн.{0,25}экран|медиафасад|видеопанел)/i],['Наружная реклама',/наружн.{0,25}реклам|размещен.{0,30}реклам|билборд/i],['Вывески / рекламные конструкции',/вывеск|светов.{0,20}букв|рекламн.{0,20}конструкц/i],['Навигация / оформление ЖК',/навигаци(?!онн.{0,15}(?:спутник|автомоб))|оформлен.{0,30}(?:жк|жил|территор)/i],['МАФ',/(?:(?:^|[^а-яёa-z0-9])маф(?:$|[^а-яёa-z0-9])|мал[ыа].{0,15}архитектурн|уличн.{0,20}мебел)/i],['Смежное оформление — проверить',/огражден.{0,30}[её]лк|декоративн.{0,20}(?:конструкц|огражден)/i]];
export const categoryCatalog=Object.freeze(topics.map(([label])=>Object.freeze({id:label,label})));
export function classify(title,tags=[]) {const t=clean(title+' '+tags.join(' ')),labels=topics.filter(([,re])=>re.test(t)).map(([label])=>label);if(/парков.{0,12}фигур|топиар/i.test(t)&&!labels.includes('МАФ'))labels.push('МАФ');return labels;}
export function place(addresses,title) {
 const a=(addresses||[]).map(x=>({country:x.country||null,region:x.region||null,city:x.city||null,area:x.area||null,address:x.building||null,comment:x.comment||null}));
 const target=/краснодар|сочи|эстосадок|адлер|геленджик|анапа|новороссийск|туапсе/i;
 if(a.length)return {addresses:a,text:a.map(x=>Object.values(x).filter(Boolean).join(', ')).join('; '),basis:'deliveryAddresses',region_match:a.some(x=>target.test([x.region,x.city,x.area].join(' ')))?'confirmed':'outside',needs_exact_address:false};
 const m=title.match(/(?:г(?:ород)?\.?\s+)(Краснодар|Сочи|Геленджик|Анапа|Новороссийск|Туапсе)(?=\s|[.,]|$)/i);
 return {addresses:[],text:m?m[0]:null,basis:m?'explicit_subject_city':'unknown',region_match:m?'confirmed':'unknown',needs_exact_address:true};
}
export const keyFor = r => `${r.source_id}:${clean(r.number)||r.source_record_id}`;
export function effective(record,now=new Date()) {
 const age=now-new Date(record.checked_at), stale=!Number.isFinite(age)||age>24*3600000;
 const expired=record.deadline.utc?Date.parse(record.deadline.utc)<=+now:false;
 let status=record.source_status.normalized;
 if(status==='open'&&expired)status='deadline_passed';
 const conflicts=[];
 if(expired&&record.source_status.normalized==='open')conflicts.push('source_open_but_deadline_passed');
 if(record.source_published_at&&Date.parse(record.source_published_at)>+now+300000)conflicts.push('future_publication');
 return {stale,expired,status,conflicts,active:status==='open'&&record.procurement_kind!=='request_for_price'&&record.alert_state!=='HOLD'&&!record.source_archived&&!stale&&!!record.deadline.utc&&record.verification==='detail_verified'&&!conflicts.length};
}
export function recordCounts(records,now=new Date()){
 const candidates=records.filter(r=>r.scope_candidate),active=records.filter(r=>r.scope_match&&effective(r,now).active);
 return {retained_publications:records.length,profile_candidates:candidates.length,confirmed_profile:records.filter(r=>r.scope_match).length,active_verified_in_scope:active.length,profile_inactive_or_unverified:candidates.filter(r=>!effective(r,now).active).length,non_profile:records.length-candidates.length};
}
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export function fingerprint(r) {const {checked_at,observed_at,evidence,first_seen_at,last_seen_at,revision,...content}=r;if(content.document_inventory){content.document_inventory={...content.document_inventory};delete content.document_inventory.checked_at;}if(content.procurement_refs)content.procurement_refs=content.procurement_refs.map(({evidence,...identity})=>identity);return createHash('sha256').update(JSON.stringify(canonical(content))).digest('hex');}
export function mergeRecords(oldRecords,incoming,at) {
 const map=new Map(oldRecords.map(x=>[keyFor(x),x])),changes=[];
 for(const input of incoming){const r=structuredClone(input),key=keyFor(r),old=map.get(key);
  // A summary-only observation cannot wipe verified details or renew their freshness.
  if(['detail_verified','needs_recheck'].includes(old?.verification)&&r.verification==='list_only'){
   const changed=old.source_status.code!==r.source_status.code||old.deadline.raw!==r.deadline.raw||old.subject!==r.subject;
   if(changed&&old.verification==='detail_verified')changes.push({at,id:key,type:'list_change_needs_detail',before:old,after:r});
   // An unresolved recheck is still a retained detail snapshot. Never replace it
   // with a list row after a failed detail/document request on a later pass.
   map.set(key,{...old,last_seen_at:at,...(changed?{verification:'needs_recheck',warnings:[...new Set([...(old.warnings||[]),'Изменение в списке: требуется повторная карточка.'])]}:{})});
   continue;
  }
  if(!old||fingerprint(old)!==fingerprint(r)){const next={...r,first_seen_at:old?.first_seen_at||at,last_seen_at:at,revision:(old?.revision||0)+1};map.set(key,next);changes.push({at,id:key,type:!old?'new':r.source_status.normalized==='cancelled'?'cancelled':'changed',before:old||null,after:next});}
  else map.set(key,{...old,...(r.document_inventory?{document_inventory:r.document_inventory}:{}),checked_at:r.checked_at,observed_at:r.observed_at,last_seen_at:at,evidence:[...new Set([...old.evidence,...r.evidence])].slice(-12)});
 }
 // Missing from a truncated feed never implies cancellation or deletion.
 return {records:[...map.values()],changes};
}
export function potentialDuplicates(records) {
 const out=[];for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){const a=records[i],b=records[j];if(a.id===b.id)continue;
  const matching=(a.procurement_refs||[]).flatMap(x=>(b.procurement_refs||[]).filter(y=>x.authority==='eis'&&y.authority==='eis'&&x.regime===y.regime&&x.notice_number===y.notice_number&&(!x.lot_number||!y.lot_number||x.lot_number===y.lot_number)).map(y=>({x,y})));
  if(matching.length){const exact=matching.find(({x,y})=>x.lot_number&&x.lot_number===y.lot_number);out.push({ids:[a.id,b.id],reason:exact?'same_eis_notice_and_lot':'same_eis_notice_lot_unverified',notice_number:matching[0].x.notice_number,lot_number:exact?.x.lot_number||null,action:'link_and_review_preserve_source_records'});continue;}
  if((a.procurement_refs||[]).some(x=>(b.procurement_refs||[]).some(y=>x.authority==='eis'&&y.authority==='eis'&&x.regime===y.regime&&x.notice_number===y.notice_number&&x.lot_number&&y.lot_number&&x.lot_number!==y.lot_number)))continue;
  if(clean(a.subject).toLowerCase()===clean(b.subject).toLowerCase()&&clean(a.buyer.name).toLowerCase()===clean(b.buyer.name).toLowerCase()&&a.performance_place.text&&a.performance_place.text===b.performance_place.text&&a.deadline.utc&&a.deadline.utc===b.deadline.utc)out.push({ids:[a.id,b.id],reason:'same_subject_buyer_place_deadline',action:'manual_review_only'});
 }return out;
}
