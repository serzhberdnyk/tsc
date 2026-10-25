import {keyFor,parseDate} from './model.js';

export const RECORD_CONTRACT_VERSION='1.0';
export const requiredRecordFields=['id','source_id','source_record_id','number','buyer','subject','performance_place','budget','deadline','source_status','direct_url','checked_at','observed_at','verification','documents','contacts','evidence','parser_version'];
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const https=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};

/** Validate the common publication shape without modifying it or its legacy IDs.
 * Source-specific field/status mappings belong in adapters. Unknown values stay null.
 * Optional procurement_refs are explicit source-backed links, never inferred title matches.
 */
export function validateRecord(r){
 const errors=[];if(!object(r))return {valid:false,errors:['record: object required']};
 for(const key of requiredRecordFields)if(!(key in r))errors.push(key+': missing');
 for(const key of ['id','source_id','source_record_id','subject','parser_version'])if(!nonempty(r[key]))errors.push(key+': nonempty string required');
 if(typeof r.number!=='string')errors.push('number: preserve as string');
 if(nonempty(r.source_id)&&r.id!==keyFor(r))errors.push('id: must preserve source:number or source:external-id');
 if(!object(r.buyer)||typeof r.buyer.name!=='string')errors.push('buyer.name: string required');
 if(!object(r.performance_place)||!Array.isArray(r.performance_place.addresses)||!['confirmed','unknown','outside'].includes(r.performance_place.region_match)||!nonempty(r.performance_place.basis))errors.push('performance_place: explicit basis and region state required');
 if(!object(r.budget)||!(r.budget.amount===null||typeof r.budget.amount==='number'&&Number.isFinite(r.budget.amount)&&r.budget.amount>=0)||!(r.budget.currency===null||typeof r.budget.currency==='string'))errors.push('budget: nullable nonnegative amount and currency required');
 if(!object(r.deadline))errors.push('deadline: object required');
 else if(r.deadline.utc!==null){const d=parseDate(r.deadline.raw);if(d.error||d.utc!==r.deadline.utc||d.timezone!==r.deadline.timezone)errors.push('deadline: raw, UTC and explicit timezone must agree');}
 else if(r.deadline.error===null)errors.push('deadline: unknown date must retain reason');
 if(!object(r.source_status)||!['open','evaluation','completed','cancelled','unknown'].includes(r.source_status.normalized))errors.push('source_status: unsupported normalized value');
 for(const key of ['checked_at','observed_at'])if(parseDate(r[key]).error)errors.push(key+': explicit timezone required');
 if(!https(r.direct_url))errors.push('direct_url: public HTTPS URL required');
 if(!['list_only','detail_verified','needs_recheck','unverified'].includes(r.verification))errors.push('verification: unsupported value');
 if(r.procurement_kind!==undefined&&!['selection_procurement','request_for_price'].includes(r.procurement_kind))errors.push('procurement_kind: unsupported value');
 for(const key of ['documents','contacts','evidence'])if(!Array.isArray(r[key]))errors.push(key+': array required');
 if(Array.isArray(r.evidence)&&(!r.evidence.length||!r.evidence.every(nonempty)))errors.push('evidence: at least one nonempty reference required');
 for(const c of Array.isArray(r.contacts)?r.contacts:[])if(!object(c)||!nonempty(c.purpose))errors.push('contact: public purpose required');
 if(r.procurement_refs!==undefined){
  if(!Array.isArray(r.procurement_refs))errors.push('procurement_refs: array required');
  else for(const ref of r.procurement_refs)if(!object(ref)||!nonempty(ref.authority)||!nonempty(ref.notice_number)||!nonempty(ref.regime)||!(ref.lot_number===null||nonempty(ref.lot_number))||!Array.isArray(ref.evidence)||!ref.evidence.length||!ref.evidence.every(nonempty))errors.push('procurement_ref: authority/notice/regime/lot/evidence required');
 }
 return {valid:errors.length===0,errors};
}
export function assertRecord(record){const result=validateRecord(record);if(!result.valid){const e=Error('record_contract: '+result.errors.join('; '));e.code='record_contract';throw e;}return record;}
export function assertRecordBatch(records){if(!Array.isArray(records))throw Error('record_contract: expected array');records.forEach(assertRecord);return records;}
