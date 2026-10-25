import {normalize} from './normalize.js';
export function stateFromHtml(html) {
 const m=html.match(/<script\b[^>]*\bid=["']bidzaar-state["'][^>]*>([\s\S]*?)<\/script>/i);
 if(!m)throw new Error('schema_changed: bidzaar-state отсутствует; это не ноль закупок');
 return JSON.parse(m[1]);
}
export function parseList(html,context) {
 const state=stateFromHtml(html),lists=Object.values(state).filter(v=>Array.isArray(v?.b?.items)&&v.b.items.some(x=>x.number&&x.name&&x.companyName));
 if(!lists.length)throw new Error('empty_or_changed: нет проверяемого списка процедур');
 const items=lists.flatMap(x=>x.b.items).filter(x=>x.procedureType===1);
 return [...new Map(items.map(x=>[x.id,x])).values()].map(x=>normalize(x,context));
}
export function parseDetail(html,listed,context) {
 const state=stateFromHtml(html),d=Object.values(state).map(x=>x?.b).find(x=>x?.generalInformation?.number&&x?.parameters);
 if(!d)throw new Error('schema_changed: публичная карточка не распознана');
 if(d.id!==listed.source_record_id||d.generalInformation.number!==listed.number)throw new Error('identity_mismatch');
 const record=normalize({id:listed.source_record_id,companyName:listed.buyer.name}, {...context,detail:d,html});
 record.parser_version='bidzaar-ssr-v2';
 const links=[...html.matchAll(/href=["']([^"']+)/g)].map(x=>x[1].replace(/&amp;/g,'&'));
 for(const doc of record.documents){const url=links.find(x=>x===`https://bidzaar.com/api/filestorage/files/download/${doc.source_file_id}`);if(url)doc.public_url=url;}
 const questionnaire=Object.values(state).find(x=>x?.u?.includes('/api/questionnairenew/requests/'))?.b;
 record.requirements=(questionnaire?.groups||[]).flatMap(g=>(g.items||[]).filter(x=>x.published===true).map(x=>({group:g.name,title:x.text,comment:x.comment||null,required:x.required===true,response_type:x.type,source_item_id:x.id})));
 const positions=Object.values(state).find(x=>x?.u?.endsWith('/positions')&&Array.isArray(x.b))?.b||[];
 record.positions=positions.map(x=>({name:x.name,description:x.description||null,quantity:x.count,unit:x.unit,source_id:x.id}));
 record.procedure_rules={...d.parameters};
 return record;
}
