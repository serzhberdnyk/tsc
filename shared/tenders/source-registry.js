import {sourceCatalog} from './source-catalog.js';
import {portSources} from './port-sources.js';
import {implementedAdapterIds} from './adapters.js';
import {sourceStopped} from './public-client.js';

const implemented=new Set(implementedAdapterIds),fresh=(at,now)=>{const age=+now-Date.parse(at);return Number.isFinite(age)&&age>=0&&age<=86400000;};
export const COVERAGE_GROUPS=Object.freeze(['government','etp_own','customer_portal']);

/** Read-only projection: availability, verification and coverage never substitute for each other.
 * The old source-status.json remains backward compatible; this does not change observations.
 */
export function buildSourceRegistry({sources=[],status={},records=[],now=new Date()}={}){
 const additions=portSources.filter(s=>!sourceCatalog.some(d=>d.id===s.id)).map(s=>({id:s.id,runtime_source_id:s.id,family_id:s.id==='nutep'?'nutep_html':'rosmorport_html',name:s.name,country:s.country,group:'customer_portal',role:'primary',url:s.url,adapter_id:s.adapter,research:{state:'implemented_awaiting_runtime',runtime_live_verified:false}}));
 const entries=[...sourceCatalog,...additions].map(def=>{
  const config=sources.find(s=>s.id===def.runtime_source_id),st=status[def.runtime_source_id]||{},raw=st.state||config?.initial_status||'not_checked';
  const isView=def.role==='view',adapterReady=!!def.adapter_id&&implemented.has(def.adapter_id);
  const runtimeAttempt=!!st.checked_at&&['live_direct','cloud_direct'].includes(st.mode);
  // Legacy probes predate explicit modes: they establish availability only, never parsed coverage.
  const availabilityState=sourceStopped(raw)?'blocked':['network_error','http_error','rate_limited'].includes(raw)?'failed':['available_partial','reachable_adapter_pending'].includes(raw)?'available':['partial','parse_error','robots_unreadable'].includes(raw)?'degraded':'unknown';
  const evidence=st.evidence||config?.evidence||[];
  const sampled=adapterReady&&runtimeAttempt&&evidence.length>0&&(st.records_observed>0||st.details_verified>0);
  // Existing verified cards retain their original proof/time after a failed attempt.
  // Only references emitted by our live evidence writer qualify; "saved"/fixture flags alone do not.
  const historical=adapterReady?records.filter(r=>r.source_id===def.runtime_source_id&&r.verification==='detail_verified'&&Number.isFinite(Date.parse(r.checked_at))&&(r.evidence||[]).some(e=>/^data\/evidence\/(?:cloud-)?\d{4}-\d{2}-\d{2}[^/]*\//.test(e))).sort((a,b)=>Date.parse(b.checked_at)-Date.parse(a.checked_at)):[];
  const last=historical[0],latestDetail=sampled&&st.details_verified>0,proof=sampled||!!last;
  const verifiedAt=latestDetail?st.checked_at:last?.checked_at||(sampled?st.checked_at:null);
  const proofEvidence=latestDetail?evidence:last?.evidence||(sampled?evidence:[]);
  const proofRuntime=latestDetail?(st.mode==='cloud_direct'?'cloud':'local'):last?(proofEvidence.some(e=>e.startsWith('data/evidence/cloud-'))?'cloud':'local'):sampled?(st.mode==='cloud_direct'?'cloud':'local'):null;
  let verificationState=isView?'inherited_family':proof?(st.details_verified>0||last?'detail_sample_verified':'list_sample_verified'):raw==='offline_replay'?'offline_replay':raw==='reachable_adapter_pending'?'page_only':def.research?'research_only':'unverified';
  const verification={state:verificationState,adapter:adapterReady?'implemented':'not_implemented',checked_at:verifiedAt,fresh:proof&&fresh(verifiedAt,now),runtime:proofRuntime,historical_only:!!last&&!latestDetail,list_checked_at:sampled&&st.records_observed>0?st.checked_at:null,latest_attempt_mode:st.mode||null,independent:def.role==='primary',records_observed:sampled?st.records_observed||0:0,details_verified:sampled?st.details_verified||0:0,evidence:proofEvidence,...(isView?{inherited_from:def.inherited_from||'bidzaar_own',scope_note:'Проверка семейства не подтверждает конкретную витрину покупателя; см. отдельные доказательства.'}:{})};
  const p=def.id==='bidzaar_own'?st.pagination:null;
  const filters=p?[{definition:p.filter||null,checked_at:p.checked_at||null,fresh:fresh(p.checked_at,now),state:p.coverage_complete===true&&p.pages_completed>0&&Number.isFinite(p.source_reported_filtered_total)&&p.unique_records>0&&p.unique_records>=p.source_reported_filtered_total?'complete_for_exact_filter':'incomplete',pages_completed:p.pages_completed??null,records_observed:p.unique_records??null,reported_total:p.source_reported_filtered_total??null,stop_reason:p.stop_reason||null,evidence:(p.pages||[]).map(x=>x.evidence).filter(Boolean)}]:[];
  const coverage={state:def.role==='routing'?'not_applicable':isView?'inherited_partial':proof?'partial':'unverified',complete_source:false,filters,retained_records:def.role==='primary'?records.filter(r=>r.source_id===def.runtime_source_id).length:0,limits:config?.coverage||'Проверенный охват не установлен.'};
  return {...def,enabled:config?.enabled===true&&adapterReady&&def.role==='primary',availability:{state:isView?'inherited_family':availabilityState,reason_code:raw,checked_at:st.checked_at||null,evidence,error:st.error||null,stopped:sourceStopped(raw)},verification,coverage,...(def.depends_on?{dependency_status:{source_id:def.depends_on,state:status[def.depends_on]?.state||'not_checked'}}:{}),next_requirement:def.role==='view'?'Использует общий адаптер семьи, не отдельное подключение.':sourceStopped(raw)?'Источник остановлен: требуется подтверждённое устранение ограничения; обход запрещён.':adapterReady?'Проверить ограниченный прямой сбор и его свежесть.':def.research.requirement};
 });
 const groups=COVERAGE_GROUPS.map(group=>{
  const rows=entries.filter(x=>x.group===group),verified=rows.filter(x=>x.role==='primary'&&['detail_sample_verified','list_sample_verified'].includes(x.verification.state));
  const ready=verified.filter(x=>x.verification.fresh&&['available','degraded'].includes(x.availability.state));
  return {group,positions:rows.length,verified_families:[...new Set(verified.map(x=>x.family_id))],fresh_verified_families:[...new Set(ready.map(x=>x.family_id))],cloud_verified_families:[...new Set(verified.filter(x=>x.verification.runtime==='cloud').map(x=>x.family_id))],complete_coverage:false,blockers:rows.filter(x=>x.role==='primary'&&!ready.includes(x)).map(x=>({source_id:x.id,state:x.availability.reason_code,requirement:x.next_requirement}))};
 });
 const families=[...new Set(groups.flatMap(x=>x.fresh_verified_families))],allGroups=groups.every(x=>x.fresh_verified_families.length>0);
 return {schema_version:'1.0',generated_at:now.toISOString(),entries,groups,readiness:{independent_verified_families:families,government_channel_verified:groups.find(x=>x.group==='government').fresh_verified_families.length>0,multi_source_verified:families.length>=2,all_three_groups_verified:allGroups,complete_product:false,reason:allGroups?'Каналы подтверждены; остальные критерии приёмки проверяются отдельно.':'Не подтверждены свежие независимые каналы всех трёх групп.'}};
}
