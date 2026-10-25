/* Unpublished integration: no API, persistence or parent messaging. */
(function(root){
'use strict';
const text=(v,max=2000)=>typeof v==='string'?v.slice(0,max):'';
const validDate=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT/.test(v)&&Number.isFinite(Date.parse(v))?v:null;
function mapContext(record){
 if(!record||typeof record.id!=='string'||!record.id.trim()||record.id.length>512||typeof record.source_id!=='string'||!record.source_id.trim()||record.source_id.length>128)return null;
 const currency=['RUB','USD','EUR','THB'].includes(record.budget?.currency)?record.budget.currency:'UNKNOWN';
 const amount=record.budget?.amount;
 const budget=currency!=='UNKNOWN'&&typeof amount==='number'&&Number.isFinite(amount)&&amount>=0&&amount<=Number.MAX_SAFE_INTEGER/100?amount:null;
 const confirmed=root.TSC_DEADLINE?.(record)?.confirmed===true;
 return {id:JSON.stringify([record.source_id,record.id]),name:text(record.buyer?.name,300)||text(record.subject,300)||'Сделка',title:text(record.subject),buyer:text(record.buyer?.name,300),verified:record.verification==='detail_verified',checked:validDate(record.checked_at),deadline:confirmed?validDate(record.deadline?.utc):null,budget,currency,source:'',payment:'Не перенесено: проверьте условия в карточке',status:text(record.source_status?.normalized,80)||'Не подтверждён',note:'Снимок текущей карточки при первом открытии оценки. Данные не обновляются автоматически. Первоисточник и условия доступны в карточке TSC. Бюджет не заполняет нашу цену.'};
}
function serialize(context){return JSON.stringify([context]).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
const prefix='tsc-assessment-context-v1:';
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 let identity;try{identity=JSON.parse(value.id);}catch{return null;}
 if(!Array.isArray(identity)||identity.length!==2||identity.some(x=>typeof x!=='string'||!x.trim())||identity[0].length>128||identity[1].length>512)return null;
 const safe=mapContext({source_id:identity[0],id:identity[1],subject:value.title,buyer:{name:value.buyer},budget:{amount:value.budget,currency:value.currency},verification:value.verified===true?'detail_verified':'unknown',checked_at:value.checked,source_status:{normalized:value.status}});
 safe.name=text(value.name,300);safe.deadline=validDate(value.deadline);return safe;
}
function open(record,trigger){
 const context=mapContext(record);if(!context)return;
 try{
  const token=crypto.randomUUID(),key=prefix+token;
  // Expire only our own stale fact handoffs. Never touch private estimates.
  for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k?.startsWith(prefix)){try{const old=JSON.parse(localStorage.getItem(k));if(!old||old.expires<Date.now())localStorage.removeItem(k);}catch{localStorage.removeItem(k);}}}
  localStorage.setItem(key,JSON.stringify({expires:Date.now()+300000,context}));
  // Same-tab navigation avoids pop-up blockers and gives normal browser Back.
  location.assign('/assessment.html#'+token);
 }catch{
  const note=document.createElement('p');note.setAttribute('role','status');note.textContent='Не удалось открыть оценку: браузер запретил локальное хранилище. Карточка не изменена.';trigger.after(note);
 }
}
function consume(token){
 if(typeof token!=='string'||!/^[a-f0-9-]{36}$/.test(token))return null;
 const key=prefix+token;
 try{
  const cached=sessionStorage.getItem(key);
  if(cached)return validate(JSON.parse(cached));
  const raw=localStorage.getItem(key);if(!raw)return null;
  const payload=JSON.parse(raw);if(!Number.isFinite(payload.expires)||payload.expires<Date.now()){localStorage.removeItem(key);return null;}
  const context=validate(payload.context);if(!context)return null;
  sessionStorage.setItem(key,JSON.stringify(context));localStorage.removeItem(key);return context;
 }catch{return null;}
}
root.TSC_ASSESSMENT={mapContext,serialize,validate,consume,open};
})(globalThis);
