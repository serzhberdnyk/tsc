import {textFromHtml,clean,parseDate,money,place,classify,keyFor} from './model.js';
export const text=html=>textFromHtml(html).replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,hex,dec)=>String.fromCodePoint(parseInt(hex||dec,hex?16:10)));
export function publication(source,item,context){
 const record={source_id:source,source_record_id:String(item.externalId||item.number),number:String(item.number),buyer:{name:item.buyer||'',source_id:null},subject:text(item.subject),description:item.description?text(item.description):null,performance_place:item.place||place([],item.subject+' '+(item.description||'')),budget:money(null),deadline:parseDate(item.deadline),source_status:{code:item.status||null,label:item.status||null,normalized:/отмен/i.test(item.status||'')?'cancelled':/заверш|окончен/i.test(item.status||'')?'completed':/итог/i.test(item.status||'')?'evaluation':/при[её]м|открыт/i.test(item.status||'')?'open':'unknown'},source_published_at:null,source_published_raw:item.published||null,source_updated_at:null,source_finished_at:null,source_archived:false,direct_url:item.url,checked_at:context.checkedAt,observed_at:context.checkedAt,verification:'list_only',live_verified:false,documents:item.documents||[],contacts:item.contacts||[],evidence:[context.evidence],parser_version:source+'-public-html-v2',warnings:['Часовой пояс срока на публичной странице не подтверждён; активность не заявляется.','Бюджет не опубликован или не извлечён.']};
 if(!record.buyer.name)record.warnings.push('Юридическое лицо заказчика в публичной карточке не установлено.');
 record.categories=classify(record.subject+' '+(record.description||''),item.tags||[]);record.scope_match=record.categories.length>0&&record.performance_place.region_match==='confirmed';record.scope_candidate=record.categories.length>0&&record.performance_place.region_match!=='outside';record.id=keyFor(record);return record;
}
const provenance=(context,field,raw)=>({url:context.url,field,raw});
// Only delivery/project wording qualifies; an organizer's address is never an execution place.
function explicitDelivery(description,context){
 const raw=description.match(/(?:с\s+учетом\s+доставки\s+в|место(?:расположение)?\s+(?:поставки|выполнения\s+работ|объекта)\s*[:—-])\s*([^;]{3,220})/i)?.[1];
 if(!raw)return null;
 const region=raw.match(/(?:Республик[ау]\s+[А-ЯЁа-яё-]+|[А-ЯЁа-яё-]+(?:ский|ская)\s+(?:край|область))/)?.[0]||null;
 const city=raw.match(/г\.\s*([А-ЯЁа-яё-]+)/)?.[1]||null;
 const knownOutside=/(?:Татарстан|Пермь|Тюмен|Тобольск|Нижнекамск|Томск|Амурск|Воронеж|Уфа)/i.test(raw);
 return {addresses:[],text:clean(raw),basis:'explicit_delivery_description',region_match:/Краснодар|Сочи|Анапа|Новороссийск|Туапсе|Геленджик/i.test(raw)?'confirmed':knownOutside?'outside':'unknown',needs_exact_address:true,provenance:provenance(context,'Предмет закупки',clean(raw)),...(region?{region_raw:region}:{}),...(city?{city_raw:city}:{})};
}
export function parseSiburPagination(html,context={}){
 const form=html.match(/<form\b[^>]*class="filter-wrapper-2"[^>]*>([\s\S]*?)<\/form>/i)?.[0];
 if(!form)return {current_page:1,last_page:null,links:[],access:'pagination_form_not_found'};
 const area=form.match(/<div\b[^>]*data-name="(PAGEN_\d+)"[^>]*>([\s\S]*?)<div class="pagination__arrows"/i);
 if(!area)return {current_page:1,last_page:1,links:[],access:'single_public_page'};
 const pages=[...area[2].matchAll(/<a\b([^>]*)>\s*(\d+)\s*<\/a>/gi)];
 const current=Number(pages.find(x=>/_current/.test(x[1]))?.[2]||1),last=Math.max(...pages.map(x=>Number(x[2])));
 const links=pages.flatMap(x=>{const href=x[1].match(/href="([^"]+)"/)?.[1];return href&&href!=='#'?[{page:Number(x[2]),url:new URL(href,context.url||'https://www.sibur.ru/ru/procurement/buy/').href}]:[];});
 // The linked public barba.js serializes currentPage as PAGEN_1. However,
 // robots.txt explicitly forbids /*PAGEN and *?: visible UI is not crawl permission.
 // Keep the observed mechanism for coverage reporting, never eligible links.
 const action=form.match(/action="([^"]*)"/)?.[1]||'';
 if(area[1]==='PAGEN_1')return {current_page:current,last_page:last,parameter:area[1],links:[],form_action:action,access:'blocked_robots_query',reason:'SIBUR robots.txt: Disallow: /*PAGEN; Disallow: *?',mechanism:'public UI serializes PAGEN_1 in same-path GET; automated pagination prohibited'};
 return {current_page:current,last_page:last,parameter:area[1],links,form_action:action,access:links.length?'public_same_path_get':'javascript_pagination_requires_verified_request'};
}
export function nextSiburListPage(html,context={}){const pages=parseSiburPagination(html,context);if(!pages.last_page||pages.current_page>=pages.last_page)return null;const next=pages.links.find(x=>x.page===pages.current_page+1);return next?.url||null;}
export function normalizeSibur(item,context){return publication('sibur',item,context);}
export function parseSiburList(html,context){
 const table=html.match(/<table\b[^>]*class="table__table"[^>]*>([\s\S]*?)<\/table>/i)?.[1];
 if(!table||!table.includes('Номер закупочной процедуры')||!table.includes('Срок подачи предложений'))throw Error('schema_changed: SIBUR public table not found');
 const body=table.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1]||'';
 const rows=[...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];if(!rows.length)throw Error('empty_or_changed: SIBUR table has no verified procedure rows');
 return rows.map(row=>{
  const cells=[...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(x=>x[1]);if(cells.length!==13)throw Error('schema_changed: SIBUR expected 13 columns');
  const values=cells.map(c=>text(c.match(/<div\b[^>]*class="text1-new table-item__text"[^>]*>([\s\S]*?)<\/div>/)?.[1]||''));
  if(!/^\d+\/\d+$/.test(values[0])||!values[1]||!values[5])throw Error('schema_changed: SIBUR missing identity/subject/deadline');
  const documents=[...cells[12].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(x=>({name:text(x[2]),public_url:new URL(x[1],'https://www.sibur.ru').href,access:'public_link_not_downloaded'}));
  const contacts=values.slice(8,11).some(Boolean)?[{purpose:'Закупщик процедуры — поля ФИО, телефон и email в публичной таблице СИБУР',public_data:{name:values[8]||null,phone:values[9]||null,email:values[10]||null}}]:[];
  const record=normalizeSibur({number:values[0],subject:values[1],description:values[2],buyer:values[6],status:values[7],deadline:values[5],published:values[4],documents,contacts,tags:[values[11]],url:context.url||'https://www.sibur.ru/ru/procurement/buy/'},context);
  record.procedure_method=values[3];record.source_category=values[11];record.participation_url=cells[0].match(/href=['"]([^'"]+)['"]/)?.[1]||null;record.detail_access='SAP login link; not opened';
  record.field_provenance={deadline:provenance(context,'Срок подачи предложений',values[5]),source_status:provenance(context,'Статус закупочной процедуры',values[7]),description:provenance(context,'Предмет закупки',values[2]),contacts:provenance(context,'ФИО/Телефон/Email закупщика',values.slice(8,11))};
  const delivery=explicitDelivery(record.description||'',context);if(delivery){record.performance_place=delivery;record.scope_match=record.categories.length>0&&delivery.region_match==='confirmed';record.scope_candidate=record.categories.length>0&&delivery.region_match!=='outside';}
  record.source_pagination=parseSiburPagination(html,context);return record;
 });
}
export function normalizeNvm(item,context){return publication('gk_nvm',item,context);}
export function parseNvmList(html,context){
 const blocks=html.split(/<div class="tender-head main-tender-head">/).slice(1);if(!blocks.length)throw Error('schema_changed: NVM tender cards absent');
 return blocks.map(block=>{
  const link=block.match(/<a href="(\/site\/view-tender\?id=(\d+))">([\s\S]*?)<\/a>/);if(!link)throw Error('schema_changed: NVM public identity missing');
  const dates=[...block.matchAll(/<div class="date-format">\s*([^<]+)<\/div>\s*<div class="time-format">\s*([^<]+)<\/div>/g)].map(x=>clean(x[1]+' '+x[2]));if(dates.length<2)throw Error('schema_changed: NVM dates missing');
  const project=text(block.match(/class="tender-head__project-name">([\s\S]*?)<\/div>/)?.[1]||'');
  const region=block.match(/tender-head__project-name">[\s\S]*?<\/div>\s*<div>\s*([^<]+)<\/div>/)?.[1];
  const execution=region?{addresses:[{country:null,region:clean(region),city:null,area:null,address:null,comment:project}],text:clean(region)+'; '+project,basis:'explicit_project_region',region_match:/Краснодарский край/i.test(region)?'confirmed':'unknown',needs_exact_address:true}:place([],link[3]);
  const record=normalizeNvm({number:link[2],subject:link[3],url:new URL(link[1],'https://tender.gk-nvm.ru').href,status:text(block.match(/class="status-badge[^\"]*">([\s\S]*?)<\/span>/)?.[1]||''),deadline:dates[1],place:execution},context);record.source_acceptance_start_raw=dates[0];record.field_provenance={source_acceptance_start:{...provenance(context,'Начало приёма заявок',dates[0]),basis:'public_list_start'}};record.project=project;record.portal_operator='ГК НВМ (название портала, не подтверждённое юрлицо заказчика)';return record;
 });
}
export function parseNvmDetail(html,listed,context){
 const visible=text(html),title=text(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'');if(!title||title!==listed.subject)throw Error('identity_mismatch: NVM title');
 if(new URL(context.url).searchParams.get('id')!==listed.number)throw Error('identity_mismatch: NVM URL');
 const rows=[...html.matchAll(/<tr\b[^>]*class="tender-content-string"[^>]*>([\s\S]*?)<\/tr>/gi)].map(x=>{const cells=[...x[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];return cells.length===2?[text(cells[0][1]),text(cells[1][1])]:null;}).filter(Boolean);
 const fields=Object.fromEntries(rows),deadline=fields['Дата окончания приема заявок'];if(!/^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}$/.test(deadline||''))throw Error('schema_changed: NVM detail deadline');
 const record={...listed,description:rows.map(([label,value])=>label+': '+value).join('\n'),deadline:parseDate(deadline),verification:'detail_verified',live_verified:true,checked_at:context.checkedAt,observed_at:context.checkedAt,evidence:[...new Set([...listed.evidence,context.evidence])],warnings:[...listed.warnings]};
 record.source_fields=fields;record.source_category=fields['Категория']||null;record.source_published_at=null;record.source_published_raw=null;record.source_acceptance_start_raw=fields['Дата начала приема заявок']||listed.source_acceptance_start_raw||null;record.project=fields['Проект']||listed.project;
 record.field_provenance={...listed.field_provenance,source_acceptance_start:provenance(context,'Дата начала приема заявок',record.source_acceptance_start_raw),deadline:provenance(context,'Дата окончания приема заявок',deadline),source_category:provenance(context,'Категория',record.source_category),description:provenance(context,'tender-content-string',fields)};
 record.categories=classify(record.subject+' '+record.description,[record.source_category||'']);record.scope_match=record.categories.length>0&&record.performance_place.region_match==='confirmed';record.scope_candidate=record.categories.length>0&&record.performance_place.region_match!=='outside';
 const explicitStatus=fields['Статус']||fields['Статус тендера'];if(explicitStatus){record.source_status={code:explicitStatus,label:explicitStatus,normalized:/отмен/i.test(explicitStatus)?'cancelled':/окончен|завершен/i.test(explicitStatus)?'completed':/итог/i.test(explicitStatus)?'evaluation':/открыт|прием/i.test(explicitStatus)?'open':'unknown'};record.field_provenance.source_status=provenance(context,'Статус',explicitStatus);}
 if(listed.deadline.raw!==deadline){record.alert_state='HOLD';record.source_conflicts=[{field:'deadline',list:listed.deadline.raw,detail:deadline}];record.warnings.push('Срок в списке отличается от карточки; HOLD до разрешения расхождения.');}
 record.execution_dates_raw={start:fields['Начало исполнения предмета тендера']||null,end:fields['Окончание исполнения предмета тендера']||null};return record;
}
