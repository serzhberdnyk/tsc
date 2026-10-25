import {stateFromHtml} from './bidzaar.js';
import {normalize} from './normalize.js';
import taxonomy from './ra-taxonomy.json' with {type:'json'};
import {matchServices} from './service-matching.js';
// Observed in Bidzaar's published PrsPublicComponent/filter serializer on 2026-10-16.
// Public page URLs only. No API calls or authentication.
export const selectedFilter={country:'Россия',region:'Краснодарский край',includes_sochi:true,status:[1],tags:['led экраны','видеопанели','медиафасады','наружная реклама','рекламная панель','рекламные вывески','световая реклама','фасадные и крышные вывески','малые архитектурные формы','маф'],tag_limitations:'Точный набор наблюдавшихся тегов; не все возможные синонимы и не все объявления без тегов.'};
export function publicQuery(page,{filtered=true,geography=filtered,tags=filtered,search=null}={}){
 if(!Number.isInteger(page)||page<1||page>8)throw new Error('page_limit');
 const u=new URL('https://bidzaar.com/app/requests/public/buy');
 for(const [k,v]of Object.entries({'paging.page':page,'paging.size':25,'paging.totalCount':true,'sorting.key':'publishDate','sorting.direction':'desc',logic:'and'}))u.searchParams.set(k,v);
 const filters=[{operator:'in',field:'status',value:'[1]'}];
 if(geography)filters.push({operator:'any',field:'deliveryAddresses.search',value:'Россия,Краснодарский край'});
 if(tags)filters.push({operator:'any',field:'tags',value:'['+selectedFilter.tags.join(',')+']'});
 if(search)u.searchParams.set('search',search);
 filters.forEach((f,i)=>Object.entries(f).forEach(([k,v])=>u.searchParams.set(`filters[${i}].${k}`,v)));
 return u.href;
}
// SSR contains a bootstrap result with totalCount=0 and sometimes 25 unrelated
// items. It is not the requested query. There is no request body in TransferState,
// so multiple nonempty query results are ambiguous and must not be merged.
export function publicResultBatch(state){
 const batches=Object.values(state).filter(x=>x?.u==='https://bidzaar.com/api/process/light/procedures/available'&&Array.isArray(x?.b?.items));
 const reliable=batches.filter(x=>Number.isInteger(x.b.totalCount)&&x.b.totalCount>0&&x.b.totalCount>=x.b.items.length);
 if(reliable.length===1)return reliable[0].b;
 if(reliable.length>1)throw Error('ambiguous_public_query_batches');
 if(batches.some(x=>x.b.totalCount===0&&x.b.items.length===0))return {items:[],totalCount:0};
 throw Error('empty_or_changed_response');
}
// Search and filter names are observed in the published serializer (saved in
// data/evidence/pagination-query-model), not private API endpoints. Regional
// filtering alone excludes cards whose public address array is empty (SUNLIGHT).
export const fixedDiscoveryQueries=Object.freeze([
 {id:'regional_tags',geography:true,tags:true},
 {id:'regional_figures',geography:true,tags:false,search:'фигур'},
 ...['LED','реклама'].map(search=>({id:'topic_'+search,geography:false,tags:false,search}))
]);
// Round-robin canonical aliases across the 16 verified service directions.
// The first window preserves the original bounded search set. Following runs
// advance through every direction before moving to their additional synonyms.
const legacySearches=['вывески','навигация','МАФ','благоустройство'];
const legacyRotation=legacySearches.map(search=>({id:'topic_'+search,geography:false,tags:false,search,alias_basis:'legacy_scope'}));
const aliasRotation=[];
const seenAliases=new Set([...legacySearches,'LED','реклама'].map(x=>x.toLocaleLowerCase('ru')));
const maxAliases=Math.max(...taxonomy.services.map(service=>service.procurement_synonyms.length));
for(let aliasIndex=0;aliasIndex<maxAliases;aliasIndex++)for(const service of taxonomy.services){
 const search=service.procurement_synonyms[aliasIndex];if(!search)continue;
 const key=search.toLocaleLowerCase('ru');if(seenAliases.has(key))continue;seenAliases.add(key);
 aliasRotation.push({id:`service_${service.id}_${aliasIndex}`,geography:false,tags:false,search,service_id:service.id,alias_index:aliasIndex,alias_basis:'ra_taxonomy_procurement_synonym'});
}
export const rotatingDiscoveryQueries=Object.freeze([...legacyRotation,...aliasRotation,...fixedDiscoveryQueries.slice(1)]);
export function discoveryQueryWindow(cursor=0,maxQueries=8){
 const normalized=Number.isSafeInteger(cursor)&&cursor>=0&&cursor<rotatingDiscoveryQueries.length?cursor:0;
 if(![4,8].includes(maxQueries))throw Error('unsupported_discovery_budget');
 const compact=maxQueries===4,slots=compact?3:4;
 const rotating=Array.from({length:slots},(_,offset)=>({...rotatingDiscoveryQueries[(normalized+offset)%rotatingDiscoveryQueries.length],rotation_index:(normalized+offset)%rotatingDiscoveryQueries.length}));
 // Advance discovery before reserving time for details. Request count and delay stay unchanged.
 return {cursor:normalized,queries:compact?[rotating[0],fixedDiscoveryQueries[0],...rotating.slice(1)]:[...fixedDiscoveryQueries,...rotating]};
}
// Compatibility export: the initial window is exactly eight public queries.
export const discoveryQueries=Object.freeze(discoveryQueryWindow().queries);
export async function walkPublicDiscovery(client,{cursor=0,maxQueries=8,reserveMs=0}={}){
 const window=discoveryQueryWindow(cursor,maxQueries);
 const report={checked_at:new Date().toISOString(),route:'public_html',filter:selectedFilter,pages_requested:0,pages_completed:0,coverage_complete:false,global_coverage_complete:false,max_pages:window.queries.length,request_cap:20,minimum_delay_ms:600,pages:[],stop_reason:'bounded_public_search_window',limitations:['Only first public HTML page per query; paging.page is ignored by observed SSR.','Search terms are a bounded discovery strategy, not full platform coverage.','No structured delivery address is required for topic discovery; geography is checked from publication fields.']};
 report.query_cursor_start=window.cursor;report.query_cursor_next=window.cursor;report.query_rotation_size=rotatingDiscoveryQueries.length;report.taxonomy_service_count=taxonomy.services.length;report.taxonomy_schema_version=taxonomy.schema_version;
 report.query_set=window.queries.map(({id,search,service_id,alias_basis,alias_index,rotation_index})=>({id,search:search||null,service_id:service_id||null,alias_basis:alias_basis||'fixed_public_query',alias_index:alias_index??null,rotation_index:rotation_index??null}));
 const records=new Map();
 for(const query of window.queries){
  if(report.pages_completed>=2&&Number.isFinite(client.expires)&&Date.now()+reserveMs>=client.expires){report.time_reserved_for_details=true;break;}
  try{
   const url=publicQuery(1,{filtered:false,...query});report.pages_requested++;
   const r=await client.get(url),batch=publicResultBatch(stateFromHtml(r.body));
   const mismatches=query.geography?checkRegion(batch.items):[];
   const entry={query_id:query.id,url,evidence:r.evidence,records_returned:batch.items.length,reported_total:batch.totalCount,query_window_complete:batch.items.length===batch.totalCount,region_mismatches:mismatches};report.pages.push(entry);
   if(mismatches.length){entry.error='public_html_ignores_selected_filter';throw Error(entry.error);}
   report.pages_completed++;
   if(query.rotation_index!==undefined)report.query_cursor_next=(query.rotation_index+1)%rotatingDiscoveryQueries.length;
   for(const item of batch.items){
    if(item.procedureType!==1)continue;
    const record=normalize(item,{checkedAt:r.meta.checked_at,evidence:r.evidence});
    const serviceMatch=matchServices([record.subject,record.description||''].join(' '),record.tags||[]);
    record.service_ids=serviceMatch.service_ids;record.service_matches=serviceMatch.matches;record.taxonomy_version=serviceMatch.taxonomy_version;
    if(query.geography){record.discovery_detail_candidate=true;record.discovery_basis='regional_public_topic_search';}
    // Global topic queries are not an excuse to persist irrelevant nationwide
    // supply lists. Unknown geography stays a candidate, never verified active.
    if(query.geography||record.scope_candidate||serviceMatch.service_ids.length&&record.performance_place.region_match!=='outside'){const prior=records.get(record.id);if(prior){record.evidence=[...new Set([...prior.evidence,...record.evidence])];if(prior.discovery_detail_candidate){record.discovery_detail_candidate=true;record.discovery_basis=prior.discovery_basis;}}records.set(record.id,record);}
   }
  }catch(e){report.stop_reason=e.code||e.message;report.error_evidence=e.evidence||null;report.errors??=[];report.errors.push({code:e.code||e.message,evidence:e.evidence||null});break;}
 }
 report.unique_records=records.size;
 return {report,records:[...records.values()]};
}
export function checkRegion(items){return items.filter(i=>!(i.deliveryAddresses||[]).some(a=>a.country==='Россия'&&/краснодарский край/i.test(a.region||''))).map(i=>({number:i.number,delivery_addresses:i.deliveryAddresses||[]}));}
export async function walkPublicFilter(client){
 const report={checked_at:new Date().toISOString(),filter:selectedFilter,route:'public_html',pages_requested:0,pages_completed:0,available_pages:null,source_reported_filtered_total:null,coverage_complete:false,max_pages:8,request_cap:20,minimum_delay_ms:600,pages:[],stop_reason:null};
 const seen=new Set(),records=[];
 try{for(let page=1;page<=8;page++){
  const url=publicQuery(page);report.pages_requested++;const r=await client.get(url),state=stateFromHtml(r.body);
  const batch=publicResultBatch(state);
  const items=[...new Map(batch.items.map(x=>[x.id,x])).values()],mismatches=checkRegion(items),totals=[batch.totalCount];
  report.pages.push({page,url,evidence:r.evidence,records_returned:items.length,reported_totals:totals,region_mismatches:mismatches});
  if(mismatches.length){report.stop_reason='public_html_ignores_selected_filter';break;}
  if(!items.length){report.stop_reason='empty_unverified_filter';break;}
  const total=Math.max(...totals.filter(Number.isFinite));
  if(!Number.isFinite(total)||total<items.length){report.stop_reason='filtered_total_not_reliable';break;}
  const fresh=items.filter(x=>!seen.has(x.id));if(page>1&&!fresh.length){report.stop_reason='repeated_page_no_progress';break;}
  report.pages_completed++;for(const item of fresh){seen.add(item.id);records.push(normalize(item,{checkedAt:r.meta.checked_at,evidence:r.evidence}));}
  report.source_reported_filtered_total=total;report.available_pages=Math.ceil(total/25);
  if(seen.size>=total){report.stop_reason='reported_filtered_total_reached';report.coverage_complete=true;break;}
  if(page===8)report.stop_reason='page_limit';
 }}catch(e){report.stop_reason=e.code||e.message;report.error_evidence=e.evidence||null;}
 report.unique_records=records.length;return {report,records};
}
