import {snapshot,importSnapshot,meta,putMeta} from './cloud-store.js';
import {validateScheduleConfig,scheduleView} from './schedule-state.js';
import {collectCloud} from './cloud-collect.js';
import {hash} from './cloud-http.js';
import {presentTenderDetail} from '../../shared/tenders/detail-presentation.js';
export const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
// The Sites dispatch layer enforces owner-only access for every route, including service requests.
// This app must never be switched to public: shared write routes rely on that boundary.
export function writeAllowed(request){const url=new URL(request.url),origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');return request.headers.get('X-Tenders-Action')===url.pathname.split('/').at(-1)&&(!origin||origin===url.origin)&&(!site||['same-origin','none'].includes(site));}
export const evidenceKey=key=>/^data\/(evidence|discovery)\/[a-zA-Z0-9_/.\-]+\.(txt|json|html)$/.test(key)&&!key.includes('..');
async function detailResponse(request,env){
 const ids=new URL(request.url).searchParams.getAll('id');
 if(ids.length!==1||!ids[0]||ids[0].length>300)return json({error:'Некорректный идентификатор закупки'},400);
 // A bound lookup only; a detail view never collects or modifies source data.
 const row=await env.DB.prepare('SELECT data FROM records WHERE id=?').bind(ids[0]).first();
 if(!row)return json({error:'Закупка не найдена'},404);
 const record=JSON.parse(row.data),warnings=[];let presentation=null;
 const keys=[...new Set((record.evidence||[]).filter(k=>typeof k==='string'&&evidenceKey(k)&&k.endsWith('.json')))].reverse().slice(0,8);
 if(record.source_id==='bidzaar')for(const key of keys){
  try{
   const object=await env.BUCKET.get(key);if(!object||object.size>32768)continue;
   const raw=await object.text();if(raw.length>32768)continue;
   const proof=JSON.parse(raw);
   if(proof.status!==200||proof.source_id!==record.source_id||proof.request_url!==record.direct_url)continue;
   if(typeof proof.body_path!=='string'||!evidenceKey(proof.body_path)||!proof.body_path.endsWith('.txt')&&!proof.body_path.endsWith('.html')||!/^[a-f0-9]{64}$/i.test(proof.saved_sha256||''))throw Error('invalid_evidence_metadata');
   const body=await env.BUCKET.get(proof.body_path);if(!body||body.size>5*1024*1024)throw Error('evidence_body_missing_or_too_large');
   const sourceHTML=await body.text();if(sourceHTML.length>5*1024*1024||hash(sourceHTML)!==proof.saved_sha256)throw Error('evidence_hash_mismatch');
   presentation=presentTenderDetail(record,{sourceHTML});break;
  }catch(e){warnings.push('Сохранённая карточка не использована: '+(String(e.message).startsWith('identity_mismatch')?'identity_mismatch':String(e.message).startsWith('evidence_hash_mismatch')?'evidence_hash_mismatch':'invalid_or_unavailable_evidence'));}
 }
 if(!presentation)presentation=presentTenderDetail(record);
 if(!presentation.subject.length&&!presentation.commercial_terms.length)warnings.push('Подробные условия показаны только из нормализованной записи; подходящее проверенное доказательство карточки не найдено.');
 presentation.warnings=[...presentation.warnings,...new Set(warnings)];
 return json({record,presentation,...(warnings.length?{warning:'Подробные условия показаны по сохранённым нормализованным данным. Проверьте полные условия на площадке.'}:{})});
}
export async function handleApi(request,env){
 try{
  if(!env.DB||!env.BUCKET)return json({error:'Хранилище не подключено'},503);
  const action=new URL(request.url).pathname.split('/').at(-1);
  if(request.method==='GET'){
   if(action==='detail')return await detailResponse(request,env);
   if(action==='health')return json({runtime:'cloudflare_worker',database:true,evidence_storage:true,imported:!!await meta(env.DB,'import_receipt'),schedule:scheduleView(await meta(env.DB,'scheduler'))});
   if(action==='data')return json(await snapshot(env.DB));
   if(action==='maintenance')return json({schema_version:1,audience:'owner_only',runtime:'cloudflare_worker',update:{method:'POST',path:'/api/collect?source=all',headers:{'X-Tenders-Action':'collect'},body:null,timeout_seconds:40},readback:{path:'/api/data',field:'collection'},backup:'/api/export',instructions:['Obtain current supported service access with Sites get_site; do not mint or rotate credentials.','Send service authorization only to this exact Site origin.','Each POST performs at most one source. Repeat the same endpoint while continue_required is true (up to five steps). A two-minute global lease prevents overlap. On uncertain response or 409, read collection before retrying; wait for lease expiry if the prior request was canceled.','A completed UTC-hour cycle is idempotent. Never reimport the initial database.','Inspect per-source outcome, last_success_at and next_retry_at. Do not bypass blocked sources or backoff.','Schedule metadata describes the saved external Sites task; it does not itself create or execute a schedule.']});
   if(action==='export')return json(await snapshot(env.DB,{full:true}),200,{'Content-Disposition':'attachment; filename="south-tenders-backup.json"'});
   return json({error:'Not found'},404);
  }
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(!writeAllowed(request))return json({error:'Недопустимый источник запроса или заголовок действия'},403);
  if(action==='collect'){const result=await collectCloud(env,{sourceId:new URL(request.url).searchParams.get('source')||'bidzaar'});return json(result,result.status||200);}
  if(action==='schedule'){const raw=await request.text();if(raw.length>4000)return json({error:'Schedule payload too large'},413);let config;try{config=validateScheduleConfig(JSON.parse(raw));}catch(e){return json({error:e.message},400);}await putMeta(env.DB,'scheduler',config).run();return json(scheduleView(config));}
  if(action==='import'){const body=await request.text();if(body.length>4000000)return json({error:'Слишком большой снимок'},413);const result=await importSnapshot(env.DB,JSON.parse(body));return json(result,result.status);}
  if(action==='evidence'){
   const body=await request.text();if(body.length>12000000)return json({error:'Слишком большой файл'},413);
   const {key,content,sha256}=JSON.parse(body);if(typeof key!=='string'||!evidenceKey(key)||typeof content!=='string'||hash(content)!==sha256)return json({error:'Некорректный файл или SHA-256'},400);
   const existing=await env.BUCKET.get(key);if(existing){if(hash(await existing.text())!==sha256)return json({error:'Существующее доказательство не перезаписывается'},409);return json({key,sha256,already_present:true});}
   await env.BUCKET.put(key,content,{customMetadata:{sha256},httpMetadata:{contentType:'text/plain; charset=utf-8'}});return json({key,sha256});
  }
  return json({error:'Not found'},404);
 }catch(e){return json({error:e.message},500);}
}
