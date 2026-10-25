import {enrichPublicDocumentIndex} from '../../shared/tenders/document-enrichment.js';
import {CloudPublicClient,sourceStopped} from './cloud-http.js';
import {getAdapter,implementedAdapterIds} from '../../shared/tenders/adapters.js';
import {portSources} from '../../shared/tenders/port-sources.js';
import {mergeRecords,potentialDuplicates,effective} from './normalize.js';
import {records,meta,stmt,putMeta,eventStatement,acquire,renew,release} from './cloud-store.js';
import {finishSourceStatus} from './retry-policy.js';
import {serviceReadModel} from '../../shared/tenders/service-projection.js';
import {countryReadModel} from '../../shared/tenders/countries.js';
import {selectDetailCandidates} from '../../shared/tenders/detail-selection.js';

export async function collectCloud(env,{fetchImpl=fetch,sourceId='bidzaar'}={}){
 if(sourceId==='all')return collectAll(env,{fetchImpl});
 const owner='single-'+crypto.randomUUID();
 if(!await acquire(env.DB,owner))return {status:409,error:'Сбор уже выполняется'};
 try{return await collectOne(env,{fetchImpl,sourceId});}finally{await release(env.DB,owner);}
}
async function collectOne(env,{fetchImpl,sourceId}){
 const db=env.DB,at=new Date().toISOString(),runId='cloud-'+at.replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8);
 if(!await meta(db,'import_receipt'))return {status:409,error:'Сначала требуется импорт сохранённой базы'};
 const old=await records(db),sources=await meta(db,'sources',[]),statuses=await meta(db,'status',{});
 if(!implementedAdapterIds.includes(sourceId))return {status:400,error:'Адаптер источника не подключён'};
 let source=sources.find(s=>s.id===sourceId);
 if(!source){const added=portSources.find(s=>s.id===sourceId);if(added){source=structuredClone(added);sources.push(source);}}
 const previous=statuses[sourceId]||{};
 if(!source?.enabled||sourceStopped(previous.state))return {status:409,error:'Источник остановлен. Обход запретов не выполняется.',source_status:statuses};
 const budgetUpgrade=previous.state==='partial'&&previous.last_error?.code==='time_budget'&&previous.records_observed>0&&previous.collector_budget_version!==2;
 if(previous.next_retry_at&&Date.parse(previous.next_retry_at)>Date.now()&&!budgetUpgrade)return {status:429,error:'Пауза после ошибки источника',source_status:statuses,next_retry_at:previous.next_retry_at};
 const adapter=getAdapter(source.adapter),incoming=[],errors=[];
 const st={state:'checking',checked_at:at,records_observed:0,details_verified:0,coverage_complete:false,evidence:[],mode:'cloud_direct',collector_budget_version:2,discovery_cursor:previous.discovery_cursor??previous.pagination?.query_cursor_next??0};
 const client=new CloudPublicClient({bucket:env.BUCKET,runId,source,fetchImpl});
 const log=(code,message,evidence=null)=>errors.push({at:new Date().toISOString(),source_id:sourceId,code,message,evidence,...(client.retryAfter?{retry_after:client.retryAfter}:{})});
 const errorState=code=>sourceStopped(code)||code==='rate_limited'?code:'partial';
 try{
  await client.checkRobots();let listed=[];
  if(adapter.capabilities.filtered){
   const walked=await adapter.collectFiltered(client,{cursor:st.discovery_cursor,maxQueries:4,reserveMs:12000});listed=walked.records;st.pagination=walked.report;st.discovery_cursor=walked.report.query_cursor_next;
   if(!walked.report.coverage_complete&&!(walked.report.stop_reason==='bounded_public_search_window'&&!walked.report.errors?.length)){st.state=errorState(walked.report.stop_reason);log(walked.report.stop_reason,'Фильтрованный проход не завершён; отсутствие результата не означает отсутствия тендеров.',walked.report.error_evidence||walked.report.pages.at(-1)?.evidence);}
   incoming.push(...listed);
  }else{
   for(const url of source.entry_urls.slice(0,adapter.max_list_pages||1)){
    const page=await client.get(url),parsed=adapter.parseList(page.body,{checkedAt:page.meta.checked_at,evidence:page.evidence,url});
    listed.push(...parsed);incoming.push(...parsed);st.records_observed=listed.length;st.list_pages_completed=(st.list_pages_completed||0)+1;
   }
  }
  st.records_observed=listed.length;
  const candidates=selectDetailCandidates({listed,retained:old,source});
  st.details_selected=adapter.capabilities.detail?candidates.map(r=>r.id):[];
  for(const r of (adapter.capabilities.detail?candidates:[])){
   if(client.stopped)break;
   if(Date.now()+5000>=client.expires){st.detail_stop_reason='bounded_network_time_window';break;}
   try{const page=await client.get(r.direct_url);const detail=adapter.parseDetail(page.body,r,{checkedAt:page.meta.checked_at,evidence:page.evidence,url:r.direct_url}),enriched=await enrichPublicDocumentIndex({adapter,client,record:detail,retained:old.find(previous=>previous.id===r.id)});incoming.push(enriched.record);st.details_verified++;if(adapter.capabilities.document_index){if(enriched.error){log(enriched.error.code,r.number+': '+enriched.error.message,enriched.error.evidence);st.state=errorState(enriched.error.code);}else{st.document_indexes_verified=(st.document_indexes_verified||0)+1;st.documents_listed=(st.documents_listed||0)+enriched.record.documents.length;}}}
   catch(e){log(e.code||'detail_parse_error',r.number+': '+e.message,e.evidence);st.state=errorState(e.code);if(client.stopped||e.code==='time_budget')break;}
  }
  if(st.state==='checking')st.state='available_partial';
  st.note=`Частичный проход ${sourceId}: ${st.pagination?.pages_completed||st.list_pages_completed||1} страниц, ${st.details_verified} карточек. Полный охват не заявляется.`;
 }catch(e){st.state=e.code||'parse_error';st.error=e.message;log(st.state,e.message,e.evidence);}
 st.evidence=client.evidence;statuses[sourceId]=finishSourceStatus(st,previous,errors);
 const merged=mergeRecords(old,incoming,at),projected=serviceReadModel(countryReadModel(merged.records,sources)),summary={run_id:runId,started_at:at,finished_at:new Date().toISOString(),mode:'cloud_direct',runtime:'cloudflare_worker',source_id:sourceId,records_total:merged.records.length,scope_candidates:projected.filter(r=>r.scope_candidate).length,verified_active_in_scope:projected.filter(r=>r.scope_match&&effective(r).active).length,changes:merged.changes.length,errors,source_status:statuses,coverage_complete:false,requests:client.counter};
 const writes=merged.records.map(r=>stmt(db,'INSERT INTO records(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',r.id,JSON.stringify(r)));
 writes.push(putMeta(db,'sources',sources),putMeta(db,'status',statuses),putMeta(db,'latest_run',summary),putMeta(db,'duplicates',potentialDuplicates(merged.records)),stmt(db,'INSERT INTO runs(id,data) VALUES(?,?)',runId,JSON.stringify(summary)));
 for(const e of errors)writes.push(eventStatement(db,'error',e));for(const c of merged.changes)writes.push(eventStatement(db,'change',c));await db.batch(writes);
 return summary;
}

// One short server step per HTTP request fits the observed Sites request lifetime.
// A lease excludes concurrent work; durable cycle progress skips completed sources.
export async function collectAll(env,{fetchImpl=fetch,now=new Date()}={}){
 const db=env.DB,cycleKey='all-'+now.toISOString().slice(0,13),owner='step-'+crypto.randomUUID();
 if(!await acquire(db,owner))return {status:409,error:'Сбор уже выполняется'};
 try{
  if(!await meta(db,'import_receipt'))return {status:409,error:'Начальная база не импортирована'};
  const prior=await meta(db,'latest_batch');
  // The caller can cross an hour boundary between source steps. Resume its
  // durable run before starting another one, retaining aliases for safe retries.
  const existing=await meta(db,'cycle:'+cycleKey)||((prior?.state==='running'&&!prior.finished_at)||prior?.cycle_key===cycleKey?prior:null);
  if(existing?.finished_at)return {...existing,already_completed:true};
  const sources=await meta(db,'sources',[]),ids=sources.filter(s=>s.enabled&&implementedAdapterIds.includes(s.id)).map(s=>s.id);
  const summary=existing||{run_id:'batch-'+crypto.randomUUID(),cycle_key:cycleKey,started_at:new Date().toISOString(),finished_at:null,runtime:'cloudflare_worker',mode:'cloud_all',sources:[],state:'running'};
  summary.cycle_keys=[...new Set([...(summary.cycle_keys||[summary.cycle_key]),cycleKey])];
  const progressWrites=()=>[putMeta(db,'latest_batch',summary),...summary.cycle_keys.map(key=>putMeta(db,'cycle:'+key,summary))];
  await db.batch(progressWrites());
  const sourceId=[...new Set(ids)].find(id=>!summary.sources.some(s=>s.source_id===id));
  if(sourceId){
   if(!await renew(db,owner))throw Error('Collector lease lost; no further source access');
   summary.current_source_id=sourceId;await db.batch(progressWrites());
   let result;
   try{result=await collectOne(env,{fetchImpl,sourceId});}
   catch(e){
    const error={at:new Date().toISOString(),source_id:sourceId,code:'collection_step_error',message:String(e.message||e)};
    const statuses=await meta(db,'status',{});
    statuses[sourceId]=finishSourceStatus({state:'partial',checked_at:error.at,records_observed:0,details_verified:0,coverage_complete:false,mode:'cloud_direct'},statuses[sourceId]||{},[error]);
    await db.batch([putMeta(db,'status',statuses),eventStatement(db,'error',error)]);
    result={error:'Не удалось завершить проверку источника',source_status:statuses};
   }
   const st=result.source_status?.[sourceId];
   summary.sources.push({source_id:sourceId,run_id:result.run_id||null,state:st?.state||'unknown',outcome:result.status?'skipped':!result.error&&st?.state==='available_partial'?'success':'failed',reason:result.error||null,records_observed:result.run_id?st?.records_observed||0:0,details_verified:result.run_id?st?.details_verified||0:0,requests:result.requests||0,last_success_at:st?.last_success_at||null,next_retry_at:st?.next_retry_at||null});
   summary.current_source_id=null;summary.last_progress_at=new Date().toISOString();
  }
  summary.continue_required=ids.some(id=>!summary.sources.some(s=>s.source_id===id));
  if(summary.continue_required){await db.batch(progressWrites());return summary;}
  summary.finished_at=new Date().toISOString();summary.state=summary.sources.length&&summary.sources.every(s=>s.outcome==='success')?'completed':'completed_with_gaps';
  summary.last_successful_batch_at=summary.state==='completed'?summary.finished_at:await meta(db,'last_successful_batch');
  await db.batch([...progressWrites(),stmt(db,'INSERT INTO runs(id,data) VALUES(?,?)',summary.run_id,JSON.stringify(summary)),...(summary.state==='completed'?[putMeta(db,'last_successful_batch',summary.finished_at)]:[])]);
  return summary;
 }finally{await release(db,owner);}
}
