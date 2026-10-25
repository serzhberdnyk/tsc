// Pure read-only presentation. Render all strings with textContent/HTML escaping.
import {descriptionSections} from './description-sections.js';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
function plain(value){return clean(String(value??'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&nbsp;/g,' ').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));}
const safeURL=value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}};
const headings={
 'Предмет закупки':'subject',
 'Критерии выбора победителя':'winner_criteria',
 'Сроки и этапы закупки':'commercial_terms',
 'Фиксация цены на срок действия контракта':'commercial_terms',
 'Условия оплаты':'commercial_terms',
 'Адрес, условия и сроки исполнения':'commercial_terms',
 'Требования к технической документации':'commercial_terms',
 'Готовность рассмотреть аналоги':'commercial_terms',
 'Требуемые условия оплаты':'commercial_terms',
 'Плановая дата монтажа':'commercial_terms',
};
function descriptionFields(record,html){
 if(!html)return [];
 const script=html.match(/<script\b[^>]*\bid=["']bidzaar-state["'][^>]*>([\s\S]*?)<\/script>/i);if(!script)throw Error('schema_changed: source detail state missing');
 const state=JSON.parse(script[1]),detail=Object.values(state).map(v=>v?.b).find(v=>v?.generalInformation?.number&&v?.parameters);
 if(!detail)throw Error('schema_changed: source detail identity missing');
 if(String(detail.generalInformation.number)!==String(record.number)||record.source_record_id&&detail.id!==record.source_record_id)throw Error('identity_mismatch: source description');
 const description=detail.generalInformation.description||'';
 return descriptionSections(description,{format:'html'}).map(part=>({...part,label:part.label||'Описание',section:headings[part.label]||'description',boundary_provenance:part.provenance,provenance:'source_description_paragraph'}));
}
const ruleDefinitions=[
 ['Сроки',[['Прием предложений до','Вид запроса'],['Напоминание участникам о завершении приема предложений за:','Срок приёма документов участников после завершения приёма предложений:'],['Срок приёма документов участников после завершения приёма предложений:','Организатор на этапе приема предложений:'],['Ориентировочный срок подведения итогов:','Подача предложений с момента публикации']]],
 ['Предложения и оценка',[['Вид запроса','После подачи предложения участники видят'],['После подачи предложения участники видят','При выборе победителя учитывается'],['При выборе победителя учитывается','Альтернативных предложений'],['Альтернативных предложений','Валюта запроса'],['Валюта запроса','Дополнительные параметры'],['Организатор на этапе приема предложений:','Ориентировочный срок подведения итогов:'],['Для организатора:','Для участников:']]],
 ['Дополнительные параметры',[['Автопродление приема предложений:','Напоминание участникам о завершении приема предложений за:']]],
];
function visibleRules(html){
 if(!html)return [];
 const start=html.indexOf('Правила проведения запроса'),body=plain(html.slice(Math.max(0,start))).replace(/\b(?:info_outline|access_time)\b/g,' ').replace(/\s+/g,' '),items=[];
 for(const [title,definitions] of ruleDefinitions){const rows=[];for(const [label,next] of definitions){const from=body.lastIndexOf(label),to=from>=0?body.indexOf(next,from+label.length):-1;if(from<0||to<0)continue;let value=clean(body.slice(from+label.length,to));if(label==='Прием предложений до')value=value.replace(/Оста[её]тся[\s\S]*$/,'').trim();if(!value)continue;rows.push({label:label.replace(/:$/,''),value,provenance:'source_visible_label',verified_label:true});}if(rows.length)items.push({title,items:rows});}
 return items;
}
function rawRules(rules){return Object.keys(rules||{}).sort().map(key=>({key,label:key,value:typeof rules[key]==='object'?JSON.stringify(rules[key]):String(rules[key]),raw_value:rules[key],verified_label:false,provenance:'record_procedure_rules',note:'Исходное значение; расшифровка не подтверждена'}));}
export function presentTenderDetail(record,{sourceHTML=null}={}){
 const fields=descriptionFields(record,sourceHTML),sections=id=>fields.filter(f=>f.section===id).map(({section,...f})=>f);
 const fallbackParagraphs=fields.length?[]:descriptionSections(record.description,{format:'plain'}).map(part=>({...part,label:part.label||'Описание',section:'description',boundary_provenance:part.provenance,provenance:'normalized_description'}));
 const groups=[];for(const item of record.requirements||[]){const name=plain(item.group)||'Прочие вопросы';let group=groups.find(g=>g.title===name);if(!group){group={title:name,items:[]};groups.push(group);}group.items.push({title:plain(item.title),comment:item.comment?plain(item.comment):null,required:typeof item.required==='boolean'?item.required:null,required_label:item.required===true?'Обязательно':item.required===false?'Необязательно':'Обязательность не указана',response_type_raw:item.response_type??null,source_item_id:item.source_item_id??null});}
 const positions=(record.positions||[]).map((item,index)=>({ordinal:index+1,source_id:item.source_id??null,name:plain(item.name),description:plain(item.description),quantity:item.quantity??null,unit:item.unit??null,height_raw:plain(item.description).match(/высота(?:\s+фигуры)?\s+([\d.,]+\s*(?:мм|см|м))(?=\s|[.,;]|$)/i)?.[1]??null}));
 const ruleGroups=visibleRules(sourceHTML),sourceRules=rawRules(record.procedure_rules);
 return {
  id:record.id,number:record.number,title:plain(record.subject),buyer:plain(record.buyer?.name),direct_url:safeURL(record.direct_url),
  subject:sections('subject'),positions,position_count:positions.length,position_order:'normalized_positions_array',
  commercial_terms:sections('commercial_terms'),winner_criteria:sections('winner_criteria'),
  description_paragraphs:fields.length?fields.map(f=>({...f})):fallbackParagraphs,
  other_description:sections('description'),description_fallback:fields.length?null:plain(record.description),
  non_price_groups:groups,non_price_count:groups.reduce((sum,g)=>sum+g.items.length,0),
  procedure_rule_groups:ruleGroups,procedure_rules_raw:sourceRules,
  source_consistency_notes:record.procedure_rules?.prolongationEnabled===false&&ruleGroups.some(g=>g.items.some(i=>i.label==='Автопродление приема предложений'))?['Карточка источника показывает период автопродления, но исходный параметр prolongationEnabled=false. Включение автопродления не подтверждено.']:[],
  procedure_rule_note:ruleGroups.length?'Показаны подписи и значения публичной карточки; исходные параметры доступны отдельно.':'Расшифровка параметров не подтверждена; показаны исходные ключи и значения.',
  files:(record.documents||[]).map(file=>({name:plain(file.name),extension:file.extension??null,size_bytes:file.size_bytes??null,access:file.access??'unknown',listed_url:safeURL(file.public_url),download_url:null,download_verified:false,source_file_id:file.source_file_id??null,note:record.document_inventory?.state==='unverified_current_check'?'Список документов не подтверждён в этом проходе; сохранена ранее известная ссылка. Содержимое файла не проверено.':/disallowed_by_robots/.test(file.access||'')?'Файл указан на источнике; автоматическое скачивание запрещено robots.txt.':'Файл указан на источнике; доступ и содержимое не проверены.'})),
  warnings:[...(record.warnings||[])],source_checked_at:record.checked_at??null,
 };
}
export const presentDetail=presentTenderDetail;
