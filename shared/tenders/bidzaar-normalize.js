import {clean,textFromHtml,parseDate,money,place,classify,keyFor} from './model.js';
export function normalizeBidzaar(item,{source='bidzaar',url,checkedAt,evidence,detail=null,html=''}={}) {
 const g=detail?.generalInformation||item, p=detail?.parameters||item;
 const subject=clean(g.name), statusCode=g.status, visible=textFromHtml(html);
 // Only codes corroborated by the public feed/card are interpreted. Others stay unknown.
 let status=({1:'open',2:'evaluation',3:'completed'})[statusCode]||'unknown';
 const statusLabel=visible.match(/Код:\s*[\d-]+\s+(Прием предложений|Приём предложений|Подведение итогов|Завершен|Отменен|Отменён)/)?.[1]||null;
 if(statusLabel&&/Отмен/.test(statusLabel))status='cancelled';
 const deadline=parseDate(p.acceptanceEndDate);
 const record={parser_version:'bidzaar-ssr-v1',source_id:source,source_record_id:item.id||detail.id,number:clean(g.number),buyer:{name:clean(item.companyName),source_id:g.companyId||item.companyId||null},subject,description:detail?textFromHtml(g.description||''):null,
 performance_place:place(g.deliveryAddresses,subject),budget:money(p.budgetEnabled?p.budget:null,p.currency||null),deadline,
 source_status:{code:statusCode,label:statusLabel,normalized:status},source_published_at:parseDate(g.publishDate).utc,source_updated_at:parseDate(g.lastModified).utc,
 source_finished_at:parseDate(g.finishDate).utc,source_archived:g.isArchived===true,checked_at:checkedAt,observed_at:checkedAt,live_verified:!!detail,direct_url:url||`https://bidzaar.com/app/process/light/${item.id}`,
 verification:detail?'detail_verified':'list_only',documents:(g.files||[]).filter(x=>!x.deletedDate).map(x=>({name:x.name,extension:x.extension,size_bytes:x.length,source_file_id:x.fileId,public_url:null,access:'listed_only_download_disallowed_by_robots',listed_at:parseDate(x.dateAdded).utc})),
 contacts:[],contact_access:detail?(detail.ownerContactInfo?'public_requires_review':'hidden_by_source'):'not_checked',tags:detail?.tags||[],evidence:[evidence],warnings:[]};
 if(detail?.ownerContactInfo)record.contacts.push({purpose:'Организатор процедуры (публичное поле ownerContactInfo)',public_data:detail.ownerContactInfo});
 // Empty structured delivery addresses do not erase an explicit work address
 // in the procedure title. Only observed address phrases qualify, never buyers.
 if(record.performance_place.region_match==='unknown'){
  const address=subject.match(/по адресу\s*:\s*([^]+?)(?:\s+для\s+ООО|$)/i)?.[1];
  if(address&&/(?:Краснодар|Сочи|Анапа)(?=[\s,/.]|$)/i.test(address))record.performance_place={addresses:[],text:address,basis:'explicit_subject_work_address',region_match:'confirmed',needs_exact_address:true};
  if(address&&/(?:Пермь|Тюмень|Тобольск|Канск|Мытищи|Казань)(?=[\s,/.]|$)/i.test(address)&&!/(?:Краснодар|Сочи|Анапа)/i.test(address))record.performance_place={addresses:[],text:address,basis:'explicit_subject_work_address',region_match:'outside',needs_exact_address:true};
 }
 record.categories=classify(subject,record.tags);record.scope_match=record.categories.length>0&&record.performance_place.region_match==='confirmed';
 record.scope_candidate=record.categories.length>0&&record.performance_place.region_match!=='outside';
 if(record.performance_place.needs_exact_address)record.warnings.push('Точный адрес исполнения не установлен; юридический адрес заказчика не используется.');
 if(record.budget.amount===null)record.warnings.push('Сумма бюджета не опубликована или не извлечена.');
 if(deadline.error)record.warnings.push('Дедлайн или его часовой пояс не подтверждён.');
 record.id=keyFor(record);return record;
}
