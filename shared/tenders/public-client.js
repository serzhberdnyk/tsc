import {createHash} from 'node:crypto';
import {AccessError,redact,robotsAllows} from './access.js';
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const SOURCE_STOP_STATES=Object.freeze(['blocked_http','blocked_robots','tls_error','redirect_loop','redirect_unverified']);
export const sourceStopped=state=>SOURCE_STOP_STATES.includes(state);

/** Shared public transport. The evidence writer is the only storage dependency.
 * writeEvidence(key, body) must persist each UTF-8 text before returning.
 * Duration is a per-client network budget, not a promise about the host runtime.
 */
export class PublicSourceClient{
 constructor({source,runId,writeEvidence,fetchImpl=fetch,budgetMs=Infinity,runtime=null}){
  if(typeof writeEvidence!=='function')throw Error('Evidence writer required');
  Object.assign(this,{source,runId,writeEvidence,fetchImpl,runtime});this.counter=0;this.last=0;this.stopped=false;this.rules=null;this.evidence=[];this.expires=Date.now()+budgetMs;
 }
 async get(url,{robots=false}={}){
  if(this.stopped)throw new AccessError('source_stopped','Источник уже остановлен');
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||parsed.origin!==new URL(this.source.url).origin||parsed.username||parsed.password||/[?&](token|auth|key)=/i.test(url))throw new AccessError('unsafe_url','URL вне разрешённого публичного источника');
  if(this.rules!==null&&!robots&&!robotsAllows(this.rules,parsed.pathname+parsed.search)){this.stopped=true;throw new AccessError('blocked_robots','Путь запрещён robots.txt',this.robotsEvidence);}
  if(this.counter>=20)throw new AccessError('request_limit','Лимит 20 запросов на источник за запуск');
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,600-(Date.now()-this.last))));
  if(Date.now()>=this.expires)throw new AccessError('time_budget','Лимит времени прохода');
  this.counter++;this.last=Date.now();
  const key=`data/evidence/${this.runId}/${this.source.id}-${String(this.counter).padStart(3,'0')}`;
  const meta={source_id:this.source.id,request_url:url,checked_at:new Date().toISOString(),method:'GET',authentication:'none',tls_verification:true,...(this.runtime?{runtime:this.runtime}:{})};let body='';
  try{
   const response=await this.fetchImpl(url,{redirect:'manual',signal:AbortSignal.timeout(Math.max(1,Math.min(20000,this.expires-Date.now()))),headers:{'User-Agent':'SouthTendersLocal/0.1'}});
   meta.status=response.status;meta.headers=Object.fromEntries(['content-type','date','last-modified','etag','age','location','retry-after'].map(k=>[k,response.headers.get(k)]).filter(([,v])=>v));
   const chunks=[],reader=response.body?.getReader();let total=0;
   if(reader)while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>5*1024*1024){await reader.cancel();throw Error('response_too_large');}chunks.push(value);}
   const bytes=Buffer.concat(chunks);body=redact(new TextDecoder().decode(bytes));meta.original_sha256=hash(bytes);meta.saved_sha256=hash(body);meta.bytes=Buffer.byteLength(body);meta.redacted=meta.original_sha256!==meta.saved_sha256;
  }catch(e){meta.error=e.message;meta.error_code=e.cause?.code||e.name;}
  meta.body_path=key+'.txt';await this.writeEvidence(meta.body_path,body);const evidence=key+'.json';await this.writeEvidence(evidence,JSON.stringify(meta,null,2));this.evidence.push(evidence);
  if(meta.error){const code=/CERT|SIGNATURE/.test(meta.error_code)?'tls_error':'network_error';if(sourceStopped(code))this.stopped=true;throw new AccessError(code,meta.error_code+': '+meta.error,evidence);}
  if([401,403].includes(meta.status)||/captcha|access denied|forbidden|verify you are human/i.test(body.slice(0,1800))&&meta.status!==404){this.stopped=true;throw new AccessError('blocked_http',`HTTP ${meta.status} или проверка доступа; источник остановлен`,evidence);}
  if(meta.status===429){this.stopped=true;this.retryAfter=meta.headers['retry-after']||null;const error=new AccessError('rate_limited','HTTP 429; текущий проход остановлен, повтор только после паузы',evidence);error.retryAfter=this.retryAfter;throw error;}
  if(meta.status>=300&&meta.status<400){this.stopped=true;const same=meta.headers.location===url;throw new AccessError(same?'redirect_loop':'redirect_unverified',`HTTP ${meta.status}, Location: ${meta.headers.location||'не указан'}`,evidence);}
  if(meta.status!==200&&!(robots&&meta.status===404))throw new AccessError('http_error',`HTTP ${meta.status}`,evidence);
  return {body,meta,evidence};
 }
 async checkRobots(){const r=await this.get(new URL('/robots.txt',this.source.url).href,{robots:true});if(r.meta.status===200&&!/^(?:\s*#.*\n|\s*)*(?:User-agent|Sitemap)/i.test(r.body))throw new AccessError('robots_unreadable','robots.txt не распознан',r.evidence);this.rules=r.meta.status===404?'':r.body;this.robotsEvidence=r.evidence;return r;}
}
