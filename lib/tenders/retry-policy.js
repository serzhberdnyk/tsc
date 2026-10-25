import {sourceStopped} from './cloud-http.js';
export function retryDeadline(value,now=Date.now()){
 if(!value)return null;
 const ms=/^\d+$/.test(String(value).trim())?now+Number(value)*1000:Date.parse(value);
 return Number.isFinite(ms)&&ms>now?ms:null;
}
export function finishSourceStatus(current,previous={},errors=[],now=Date.now()){
 const lastSuccess=previous.last_success_at||(previous.state==='available_partial'?previous.checked_at:null)||null;
 const success=current.state==='available_partial'&&errors.length===0&&(current.records_observed>0||current.pagination?.pages_completed>0);
 const failures=success?0:(previous.consecutive_failures||0)+1;
 const stopped=sourceStopped(current.state);
 const retry=success||stopped?null:Math.max(now+Math.min(24,2**Math.min(failures-1,5))*3600000,...errors.map(e=>retryDeadline(e.retry_after,now)||0));
 return {...current,last_attempt_at:current.checked_at,last_success_at:success?new Date(now).toISOString():lastSuccess,consecutive_failures:failures,next_retry_at:retry?new Date(retry).toISOString():null,retry_policy:stopped?'manual_review_required':success?'hourly_schedule':'exponential_1h_to_24h_respect_retry_after',last_error:success?null:errors.at(-1)||previous.last_error||null};
}
