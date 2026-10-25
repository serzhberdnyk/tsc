import {publication,comparePublication,calendarDay} from '../../public/tender-dates.js';
// This shared view does not mutate source records or infer missing dates.
export function publicationDate(record){const value=publication(record);return value.known?{...value,sort_key:value.utc||value.day,date_only:value.precision==='date',timezone_unknown:value.precision!=='instant'}:null;}
export function newTenderItems(records,{now=new Date(),limit=6}={}){
 const today=calendarDay(+now),seen=new Set();
 return records.filter(r=>r.scope_match&&!r.source_archived&&r.procurement_kind!=='request_for_price'&&!['completed','cancelled'].includes(r.source_status.normalized)).map(r=>({id:r.id,publication:publicationDate(r)})).filter(x=>x.publication&&(x.publication.utc?Date.parse(x.publication.utc)<=+now+300000:x.publication.day<=today)).sort((a,b)=>comparePublication(records.find(r=>r.id===a.id),records.find(r=>r.id===b.id))).filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true;}).slice(0,limit);
}
