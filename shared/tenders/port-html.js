import {publication,text} from './public-html.js';
import {clean,money,place,keyFor} from './model.js';
export const NUTEP_URL='https://www.nutep.ru/about/purchases/';
export const ROSMORPORT_URL='https://www.rosmorport.ru/filials/nvr_purchase_main/';
export const ROSMORPORT_PRICES_URL='https://www.rosmorport.ru/filials/nvr_purchase_zaprosy_cen/';
const capture=(html,cls)=>text(html.match(new RegExp('class="'+cls+'"[^>]*>([\\s\\S]*?)<\\/div>','i'))?.[1]||'');
const field=(html,label)=>text(html.match(new RegExp('<div>'+label+':<\\/div>\\s*<span>([\\s\\S]*?)<\\/span>','i'))?.[1]||'');
const eisRefs=(notice,context,regime='223-FZ')=>notice?[{authority:'eis',notice_number:notice,regime,lot_number:null,evidence:[context.evidence]}]:[];
const priceInquiry=t=>/для\s+определения\s+начальной|(?:запрос|предоставлени)[\s\S]{0,45}ценовой\s+информации|для\s+(?:расч[её]та|формирования)\s+НМЦ/i.test(t);
function validLocalDate(raw){const m=raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);if(!m)throw Error('schema_changed: invalid calendar date');const [d,mo,y]=m.slice(1).map(Number);if(mo<1||mo>12||d<1||d>new Date(Date.UTC(y,mo,0)).getUTCDate())throw Error('schema_changed: invalid calendar date');return raw;}
const calendarDate=raw=>{if(!raw)return null;validLocalDate(raw);return raw.split('.').reverse().join('-');};
function provenance(record,context,fields){
 record.parser_version=record.source_id+'-public-html-v2';
 // A calendar day is useful for ordering and auditing but is not an instant.
 record.source_published_date=calendarDate(record.source_published_raw);
 record.field_provenance=Object.fromEntries(Object.entries(fields).map(([field,value])=>[field,{source_url:context.url||record.source_listing_url,raw:value,verification:'public_inline_html'}]));
 record.completeness={deadline_time:!!record.deadline.utc,deadline_timezone:!!record.deadline.timezone,performance_place:record.performance_place.region_match!=='unknown',documents_read:false,public_contact:record.contacts.length>0};
 return record;
}
export function portSubjectPlace(subject){
 const known=place([],subject);if(known.basis!=='unknown')return known;
 // Only explicit work-location phrases in the subject, never the buyer/branch address.
 const m=subject.match(/(?:морск[а-яё]+\s+порт[а-яё]*|г\.|город[а-яё]*|районе\s+пос\.)\s+«?\s*(Новороссийск[ае]?|Туапсе|Сочи|Геленджик[ае]?|Анап[аеа]|Ейск[ае]?|Ялта|Ялты|Азов[ае]?|Таганрог[ае]?)(?=[\s».,)]|$)/i);
 if(!m)return known;
 const outside=/^(Ялт|Азов|Таганрог)/i.test(m[1]);
 return {addresses:[],text:m[0],basis:'explicit_subject_work_location',region_match:outside?'outside':'confirmed',needs_exact_address:true};
}
function finish(record,{kind,method,notice,context}){
 record.procurement_kind=kind;record.procedure_method=method||null;record.procurement_refs=eisRefs(notice,context);
 record.alert_state='HOLD';record.verification='list_only';record.live_verified=false;
 record.warnings=['Получен список; канонические документы/карточка и точное место исполнения не проверены.','Часовой пояс и точное время приёма не подтверждены; запись не считается активным лидом.'];
 if(record.budget.amount===null)record.warnings.push('Бюджет не опубликован или не извлечён.');
 if(kind==='request_for_price')record.warnings.push('Запрос ценовой информации для НМЦК; это не выбор подрядчика.');
 if(notice)record.warnings.push('Номер ЕИС взят из первоисточника; лоты не установлены, совпадения требуют проверки.');
 record.id=keyFor(record);return record;
}
export function normalizeNutep(item,context){
 const r=publication('nutep',{...item,buyer:'ООО «НУТЭП»',place:portSubjectPlace(item.subject)},context);
 r.budget=item.budget||money(null);r.local_procedure_number=item.localNumber;r.source_published_precision='date';r.deadline.precision='date';
 r.source_status.normalized=/отмен/i.test(item.status)?'cancelled':/заверш/i.test(item.status)?'completed':/действующ/i.test(item.status)?'open':'unknown';r.source_archived=r.source_status.normalized==='completed';r.source_listing_url=NUTEP_URL;r.detail_access='inline public list; linked files not downloaded';
 finish(r,{kind:priceInquiry(item.subject)?'request_for_price':'selection_procurement',method:item.method,notice:item.eisNumber,context});
 r.deadline.local_date=calendarDate(item.deadline);r.deadline.missing=['time','timezone'];
 r.detail_access='inline expanded purchase panel; attachment paths /upload/ disallowed by robots.txt';
 r.access_limitations=[{kind:'robots_disallow',source_url:'https://www.nutep.ru/robots.txt',path:'/upload/',effect:'linked procurement documents cannot be fetched'}];
 return provenance(r,context,{subject:r.subject,status:item.status,publication_date:item.published,deadline:item.deadline,budget:r.budget.raw,performance_place:r.performance_place.text});
}
export function parseNutepList(html,context){
 if(!html.includes('Положение о закупках ООО НУТЭП'))throw Error('schema_changed: NUTEP buyer identity missing');
 const blocks=html.split(/<div class="news_item purchase_item">/).slice(1);if(!blocks.length)throw Error('empty_or_changed: NUTEP purchase blocks absent');
 return blocks.map(original=>{
  const block=original.split('<div class="buttons">')[0],localNumber=capture(block,'purch_num').replace(/^№\s*/,''),subject=capture(block,'purch_title'),status=capture(block,'purch_status');
  const dates=capture(block,'purch_date').match(/^(\d{2}\.\d{2}\.(\d{4}))\s*[—–-]\s*(\d{2}\.\d{2}\.\d{4})$/);
  if(!/^\d+$/.test(localNumber)||!subject||!dates)throw Error('schema_changed: NUTEP identity/dates missing');
  validLocalDate(dates[1]);validLocalDate(dates[3]);
  const eisNumber=subject.match(/ЕИС\s*:?\s*№\s*(\d{11})(?!\d)/i)?.[1]||null;
  const amountRaw=field(block,'Стоимость закупки'),amount=amountRaw.match(/^([\d\s\u00a0]+(?:,\d{1,2})?)\s*руб/i);
  const budget=amount?{...money(amount[1],'RUB'),raw:amountRaw}:money(null);if(!amount&&amountRaw)budget.raw=amountRaw;
  const documents=[...block.matchAll(/<div class="purch_link"><a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>{const u=new URL(m[1].replaceAll('&amp;','&'),NUTEP_URL);return {name:text(m[2]),public_url:u.href,access:u.origin===new URL(NUTEP_URL).origin&&u.pathname.startsWith('/upload/')?'robots_disallowed_not_downloaded':'public_link_not_downloaded'};});
  const r=normalizeNutep({number:dates[2]+'-'+localNumber,externalId:dates[2]+'-'+localNumber,localNumber,subject,status,published:dates[1],deadline:dates[3],budget,documents,method:field(block,'Способ закупки'),eisNumber,url:NUTEP_URL},context);
  r.department=field(block,'Подразделение')||null;
  const cancelled=documents.filter(d=>/отказ[-\s]+от[-\s]+закупки|otkaz-ot-zakupki/i.test(d.name+' '+d.public_url));
  if(cancelled.length){
   // The buyer explicitly labels an attachment as cancellation. Retain the list
   // badge and the uninspected document separately instead of hiding the conflict.
   r.cancellation_evidence=cancelled.map(d=>({basis:'buyer_document_link_title',name:d.name,url:d.public_url,document_content_verified:false}));
   r.source_status.normalized='cancelled';r.source_archived=true;
   r.field_provenance.status={...r.field_provenance.status,normalized_basis:'buyer_document_link_title',document_titles:cancelled.map(d=>d.name)};
   r.warnings.push('На странице заказчика опубликована ссылка «Отказ от закупки»; содержимое файла закрыто для сбора robots.txt. Исходная отметка статуса сохранена.');
  }
  return r;
 });
}
export function normalizeRosmorport(item,context){
 const r=publication('rosmorport_azov_black_sea',{...item,buyer:'ФГУП «Росморпорт», Азово-Черноморский бассейновый филиал',place:portSubjectPlace(item.subject)},context);
 r.buyer.source_id='7702352454';r.source_listing_url=item.listUrl;r.source_published_precision='date';r.portal_record_id=item.portalId;
 r.source_status.normalized=/подача заявок/i.test(item.status)?'open':/работа комиссии|рассмотрен|итог/i.test(item.status)?'evaluation':/отмен/i.test(item.status)?'cancelled':/заверш/i.test(item.status)?'completed':'unknown';
 r.detail_access='External EIS/ETP link retained; not followed';
 finish(r,{kind:item.kind,method:item.kind==='request_for_price'?'Запрос ценовой информации':null,notice:item.eisNumber,context});
 r.deadline.missing=['date','time','timezone'];
 r.local_procedure_number=r.subject.match(/№\s*([А-ЯЁA-Z0-9][А-ЯЁA-Z0-9/\s-]{0,90}?)(?=\s+(?:по|для)\s)/i)?.[1]||null;
 r.detail_origin=new URL(r.direct_url).origin;
 r.access_limitations=[{kind:'external_detail_not_fetched',source_url:r.direct_url,effect:'deadline, budget and exact execution place are not exposed in the source-local list'},{kind:'robots_disallow',source_url:'https://www.rosmorport.ru/robots.txt',path:'*?PAGEN_',effect:'pagination cannot be fetched'}];
 return provenance(r,context,{subject:r.subject,status:item.status,publication_date:item.published,deadline:null,performance_place:r.performance_place.text});
}
export function parseRosmorportList(html,context){
 const h1=text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||''),isPrice=/^Запросы ценовых предложений/.test(h1);
 if(!/Азово-Черноморского бассейнового филиала/.test(h1)||!isPrice&&!/^Закупки для нужд/.test(h1))throw Error('schema_changed: Rosmorport list heading');
 const blocks=[...html.matchAll(/<div id="bx_\d+_(\d+)">([\s\S]*?)(?=<div id="bx_|<\/div>\s*<br\s*\/?><div class="pagination")/g)];if(!blocks.length)throw Error('empty_or_changed: Rosmorport listing absent');
 return blocks.map(m=>{
  const b=m[2],link=b.match(/<a href="(https:\/\/[^\"]+)">([\s\S]*?)<\/a>/),date=text(b.split('<br')[0]).match(/^(\d{2}\.\d{2}\.\d{4})/),status=b.match(/class="status_zakupki_brief"[^>]*alt="([^"]+)"/)?.[1];
  if(!link||!date||!status)throw Error('schema_changed: Rosmorport identity/date/status');
  validLocalDate(date[1]);
  const url=link[1].replaceAll('&amp;','&'),u=new URL(url),subject=text(link[2]);if(!subject)throw Error('schema_changed: empty subject');
  const eisNumber=u.hostname==='zakupki.gov.ru'&&/^\d{11}$/.test(u.searchParams.get('regNumber')||'')?u.searchParams.get('regNumber'):null;
  const kind=isPrice||priceInquiry(subject)?'request_for_price':'selection_procurement';
  return normalizeRosmorport({number:eisNumber||(kind==='request_for_price'?'price-':'notice-')+m[1],externalId:m[1],portalId:m[1],subject,published:date[1],deadline:null,status,url,listUrl:isPrice?ROSMORPORT_PRICES_URL:ROSMORPORT_URL,eisNumber,kind},context);
 });
}
