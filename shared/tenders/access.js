export class AccessError extends Error {constructor(code,message,evidence){super(message);this.code=code;this.evidence=evidence;}}
export function redact(text) {return text.replace(/((?:access_token|refresh_token|csrf_token|xsrf_token|password|client_secret)["']?\s*[:=]\s*["'])([^"']+)(["'])/gi,'$1[REDACTED]$3').replace(/([?&](?:token|access_token|auth)=)[^&"'\s<>]+/gi,'$1[REDACTED]');}
export function robotsAllows(text,pathname) {
 const groups=[];let group=null,seenRule=false;
 for(const line of text.split(/\r?\n/)){const m=line.replace(/#.*/,'').trim().match(/^([\w-]+)\s*:\s*(.*)$/);if(!m)continue;const key=m[1].toLowerCase(),value=m[2].trim();
 if(key==='user-agent'){if(!group||seenRule){group={agents:[],rules:[]};groups.push(group);seenRule=false;}group.agents.push(value.toLowerCase());}
 else if(group&&['allow','disallow'].includes(key)){seenRule=true;if(value)group.rules.push({allow:key==='allow',pattern:value});}}
 const specific=groups.filter(g=>g.agents.some(a=>a!=='*'&&'southtenderslocal'.includes(a)));
 const selected=specific.length?specific:groups.filter(g=>g.agents.includes('*'));
 const rules=selected.flatMap(g=>g.rules).filter(r=>{const expr=r.pattern.replace(/[.+?^{}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*');return new RegExp('^'+expr).test(pathname)}).sort((a,b)=>b.pattern.length-a.pattern.length||Number(b.allow)-Number(a.allow));
 return !rules.length||rules[0].allow;
}
