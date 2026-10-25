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

globalThis.TSC_DEADLINE=function deadlineView(record,now=Date.now()){
 const d=record?.deadline||{},raw=typeof d.raw==='string'?d.raw:'',match=raw.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d+)?(Z|[+-]\d\d:\d\d)$/);
 const time=Date.parse(d.utc),rawTime=Date.parse(raw),checked=typeof now==='number'?now:+new Date(now);
 const valid=!!match&&Number.isFinite(time)&&time===rawTime&&d.error===null&&(d.timezone===(match[7]==='Z'?'UTC':match[7]))&&record.verification==='detail_verified'&&Number.isFinite(checked)&&+match[2]>=1&&+match[2]<=12&&+match[3]>=1&&+match[3]<=new Date(Date.UTC(+match[1],+match[2],0)).getUTCDate()&&+match[4]<24&&+match[5]<60&&+match[6]<60;
 if(!valid)return {confirmed:false,date_label:d.raw||'Не указан',timezone_label:'Время или часовой пояс не подтверждены',remaining_label:'Срок приёма не подтверждён',state:'unknown'};
 const date_label=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(time));
 const base={confirmed:true,date_label,timezone_label:'МСК (UTC+3)',deadline_utc:new Date(time).toISOString()};
 const state=record.source_status?.normalized;
 if(time<=checked||['completed','cancelled','evaluation'].includes(state))return {...base,remaining_label:'Приём завершён',state:'finished'};
 if(state!=='open')return {...base,remaining_label:'Статус приёма не подтверждён',state:'unknown'};
 const delta=time-checked;
 const plural=(n,forms)=>forms[n%100>=11&&n%100<=14?2:n%10===1?0:n%10>=2&&n%10<=4?1:2];
 if(delta>=86400000){const days=Math.floor(delta/86400000);return {...base,remaining_label:`${days%10===1&&days%100!==11?'Остался':'Осталось'} ${days} ${plural(days,['день','дня','дней'])}`,state:'open'};}
 const minutes=Math.ceil(delta/60000),hours=Math.floor(minutes/60),rest=minutes%60;
 return {...base,remaining_label:hours?`Осталось ${hours} ч ${rest} мин`:`Осталось ${minutes} мин`,state:'open'};
};

(()=>{
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const safeLink=(text,url)=>{const a=el('a',text);try{const u=new URL(url);if(u.protocol==='https:'&&!u.username&&!u.password){a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';}}catch{}return a;};
function paragraphs(record,p){return (p.description_paragraphs||[]).filter(x=>!x.section||x.section==='subject'||x.section==='description').map(x=>({text:x.text||x.value||'',kind:x.kind})).filter(x=>x.text);}
function blocks(parent,items){let list;for(const item of items){const text=item.text||item.value||'',bullet=text.match(/^\s*[-•]\s+/);if(item.kind==='list_item'||bullet){if(!list){list=el('ul');parent.append(list);}list.append(el('li',bullet?text.slice(bullet[0].length):text));}else{list=null;parent.append(el('p',text));}}}
function deadline(record){const view=TSC_DEADLINE(record,Date.now()),box=el('aside',null,'modal-deadline');box.append(el('span','Приём предложений до','muted'),el('strong',view.date_label),el('span',view.timezone_label,'muted'),el('span',view.remaining_label,'remaining'));return box;}
function fullURL(record){const url=new URL(location.href);url.search='';url.searchParams.set('tender',record.id);return url.href;}
function status(record){if(record.source_status?.normalized==='open'&&record.deadline?.utc&&Date.parse(record.deadline.utc)<=Date.now())return 'Срок подачи истёк';return {open:'Приём предложений',cancelled:'Отменено',completed:'Завершено',evaluation:'Подведение итогов'}[record.source_status?.normalized]||'Статус не указан';}
function rows(items){const dl=el('dl');for(const i of items){const row=el('div',null,'fact-row');row.append(el('dt',i.label),el('dd',i.value));dl.append(row);}return dl;}
function section(container,id,title){const s=el('section',null,'modal-section');s.id=id;s.append(el('h3',title));container.append(s);return s;}
function detailed(record,p,target){target.replaceChildren();const hero=el('div',null,'modal-hero'),heading=el('div');heading.append(el('span',(record.source_id==='bidzaar'?'Bidzaar':record.source_id)+(record.number?' · №'+record.number:''),'modal-eyebrow'));const title=el('h2',record.subject);title.id=target.id==='dialog-content'?'dialog-title':'page-title';heading.append(title,el('p',record.buyer.name,'modal-buyer'),el('span',status(record),'status-chip'));hero.append(heading,deadline(record));target.append(hero);const context=el('div',null,'modal-context');context.append(el('span','Место исполнения: '+record.performance_place.text),el('span','Бюджет: '+(record.budget.amount==null?'не опубликован':record.budget.amount+' '+record.budget.currency)));target.append(context);
const outline=el('nav',null,'modal-outline');outline.setAttribute('aria-label','Разделы объявления');target.append(outline);const prefix=target.id==='dialog-content'?'dialog-':'page-';const add=(key,label)=>{const s=section(target,prefix+key,label),a=el('a',label);a.href='#'+s.id;a.addEventListener('click',e=>{e.preventDefault();s.scrollIntoView({block:'start',behavior:'instant'});});outline.append(a);return s;};
add('dates','Даты объявления').append(rows(globalThis.TSC_DATES.chronology(record,globalThis.TSC_DISPLAY_TIMEZONE)));
const description=add('description','Описание');blocks(description,paragraphs(record,p).length?paragraphs(record,p):[{text:record.description||record.subject}]);
if(p.positions?.length){const spec=add('specification','Спецификация · '+p.positions.length),list=el('ol',null,'modal-positions');for(const [index,item]of p.positions.entries()){const row=el('li'),content=el('div');content.append(el('strong',item.name));if(item.description)content.append(el('p',item.description));row.append(el('span',String(index+1)+'.','muted'),content,el('span',[item.quantity,item.unit].filter(x=>x!=null&&x!=='').join(' '),'quantity'));list.append(row);}spec.append(list);}
if(p.commercial_terms?.length)add('terms','Условия').append(rows(p.commercial_terms));
if(p.winner_criteria?.length){const criteria=add('criteria','Критерии выбора');for(const item of p.winner_criteria)criteria.append(el('p',item.text||item.value));}
if(p.non_price_groups?.length){const questions=add('questions','Вопросы заказчика · '+p.non_price_count);for(const group of p.non_price_groups){questions.append(el('h4',group.title));for(const item of group.items){const q=el('div',null,'modal-question'),head=el('div',null,'modal-question-title');head.append(el('strong',item.title),el('span',item.required_label,'muted'));q.append(head);if(item.comment)q.append(el('p',item.comment));questions.append(q);}}}
if(p.procedure_rule_groups?.length||p.procedure_rules_raw?.length){const rules=add('rules','Правила процедуры');for(const group of p.procedure_rule_groups||[]){rules.append(el('h4',group.title),rows(group.items));}for(const note of p.source_consistency_notes||[])rules.append(el('p',note,'source-note'));if(p.procedure_rule_note)rules.append(el('p',p.procedure_rule_note,'source-note'));if(p.procedure_rules_raw?.length){const raw=el('details');raw.append(el('summary','Исходные параметры источника'),el('pre',p.procedure_rules_raw.map(x=>x.key+': '+x.value).join('\n')));rules.append(raw);}}
if(record.contacts?.length){const contacts=add('contacts','Публичные контакты');for(const item of record.contacts){const values=item.public_data&&typeof item.public_data==='object'?Object.values(item.public_data).filter(Boolean).join(' · '):String(item.public_data||'');if(values)contacts.append(el('p',[item.purpose,values].filter(Boolean).join(': ')));}}
// Documents occupy this same final section in every tender; no alternate card columns.
const docs=add('documents','Документы · '+(p.files?.length||0));docs.dataset.documents='true';if(!p.files?.length)docs.append(el('p','Источник не перечислил документы.'));for(const file of p.files||[]){const row=el('div',null,'modal-file'),text=el('div');text.append(el('strong',file.name));if(file.note)text.append(el('p',file.note,'muted'));const url=file.listed_url||file.public_url;if(url&&!/disallowed_by_robots/.test(file.access||''))text.append(safeLink('Открыть файл у источника',url));row.append(text,el('span',[file.extension?.toUpperCase(),file.size_bytes!=null?file.size_bytes+' байт':null].filter(Boolean).join(' · '),'muted'));docs.append(row);}
const assess=el('button','Оценить сделку · личные расчёты');assess.type='button';assess.addEventListener('click',()=>globalThis.TSC_ASSESSMENT.open(record,assess));target.append(assess);
const footer=el('footer',null,'modal-source');footer.append(safeLink('Первичная публикация',record.direct_url),el('span','Проверено: '+record.checked_at,'muted'));target.append(footer);
}
let dialog=null,session=0,opener=null,savedScroll=0,previousOverflow='',currentRecord=null,cleaned=true;
function cleanup(){if(cleaned)return;cleaned=true;session++;currentRecord=null;document.body.style.overflow=previousOverflow;if(opener?.isConnected)opener.focus({preventScroll:true});scrollTo({top:savedScroll,left:0,behavior:'instant'});}
function closeDialog(){if(dialog?.open){dialog.close();cleanup();}}
function ensureDialog(){if(dialog)return;dialog=el('dialog');dialog.id='tender-dialog';dialog.setAttribute('aria-labelledby','dialog-title');const toolbar=el('div',null,'dialog-toolbar'),caption=el('span','Подробности объявления'),documents=el('a','Документы'),full=el('a','Полная страница ↗'),close=el('button','×'),scroll=el('div',null,'dialog-scroll'),content=el('div');documents.id='dialog-document-link';documents.href='#dialog-documents';full.id='dialog-full-page';close.id='dialog-close';close.type='button';close.setAttribute('aria-label','Закрыть подробности');scroll.id='dialog-scroll';content.id='dialog-content';scroll.append(content);toolbar.append(caption,documents,full,close);dialog.append(toolbar,scroll);document.body.append(dialog);close.addEventListener('click',closeDialog);documents.addEventListener('click',e=>{e.preventDefault();$('dialog-documents')?.scrollIntoView({block:'start',behavior:'instant'});});full.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();const record=currentRecord;closeDialog();globalThis.TSC_DETAIL.open(record);});dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();});dialog.addEventListener('close',()=>{if(!dialog.open)cleanup();});dialog.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const controls=[...dialog.querySelectorAll('button,a[href],summary,input,select,[tabindex="0"]')].filter(x=>x.getClientRects().length&&!x.disabled),first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});}
function paintDialog(record,presentation,warning){currentRecord=record;detailed(record,presentation,$('dialog-content'));$('dialog-full-page').href=fullURL(record);$('dialog-document-link').textContent='Документы · '+(presentation.files?.length||0);if(warning){const note=el('p',warning,'modal-loading-note');$('dialog-content').querySelector('.modal-hero').after(note);}}
globalThis.TSC_MODAL={show(record,presentation,trigger,warning){ensureDialog();if(dialog.open)closeDialog();const ticket=++session;cleaned=false;opener=trigger;savedScroll=scrollY;previousOverflow=document.body.style.overflow;paintDialog(record,presentation,warning);dialog.showModal();document.body.style.overflow='hidden';$('dialog-scroll').scrollTop=0;$('dialog-close').focus({preventScroll:true});return ticket;},update(ticket,record,presentation,warning){if(!dialog?.open||ticket!==session||currentRecord?.id!==record.id)return;const scroll=$('dialog-scroll').scrollTop,active=document.activeElement,key=active?.getAttribute('href');paintDialog(record,presentation,warning);$('dialog-scroll').scrollTop=scroll;if(!active?.isConnected){const replacement=key?[...dialog.querySelectorAll('a[href]')].find(a=>a.getAttribute('href')===key):null;(replacement||$('dialog-close')).focus({preventScroll:true});}},close:closeDialog};
globalThis.TSC_SUMMARY_CARD=(record,presentation,card)=>{let state=card.__summary;const active=document.activeElement,focused=card.contains(active),before=focused?active.getBoundingClientRect().top:null;if(!state){const existing=card.querySelector('.record-badges'),badges=el('span',null,'record-badges');if(existing)badges.append(...existing.childNodes);card.replaceChildren();card.className='card summary-card';const button=el('button',null,'summary-open'),main=el('span',null,'summary-main'),title=el('span',null,'summary-title'),buyer=el('span',null,'summary-buyer'),description=el('span',null,'summary-description'),scope=el('span',null,'summary-scope'),published=el('span',null,'summary-publication'),side=el('span',null,'summary-side'),date=el('span',null,'deadline-date'),zone=el('span',null,'deadline-zone muted'),countdown=el('span',null,'deadline-countdown');button.type='button';button.setAttribute('aria-haspopup','dialog');main.append(badges,published,title,buyer,description,scope);side.append(el('span','Приём предложений до','muted'),date,zone,countdown);button.append(main,side);card.append(button);state={button,title,buyer,description,scope,published,date,zone,countdown,record};card.__summary=state;button.addEventListener('click',event=>{const selection=globalThis.getSelection?.(),selected=selection&&!selection.isCollapsed&&button.contains(selection.anchorNode)&&button.contains(selection.focusNode);if(event.detail!==0&&selected){event.preventDefault();return;}globalThis.TSC_DETAIL.openDialog(state.record,button);});card.addEventListener('click',event=>{if(event.target===card)button.click();});}
state.record=record;const chronology=globalThis.TSC_DATES.chronology(record,globalThis.TSC_DISPLAY_TIMEZONE);state.published.textContent=chronology[0].label+': '+chronology[0].value;state.title.textContent=record.subject;state.buyer.textContent=record.buyer?.name||'Заказчик не указан';state.button.setAttribute('aria-label','Подробнее: '+record.subject);const description=paragraphs(record,presentation).filter(p=>p.text!==record.subject).slice(0,2).map(p=>p.text).join(' ')||presentation.description_fallback||record.description||'';state.description.textContent=description.length>340?description.slice(0,337)+'…':description;state.scope.replaceChildren(el('span',record.performance_place?.text||'Место исполнения не указано'),el('span','Спецификация · '+(presentation.positions?.length||0)+' поз.'));for(const fact of chronology.filter(x=>['acceptance','discovered','checked'].includes(x.key)))state.scope.append(el('span',fact.label+': '+fact.value));state.tick=()=>{const d=TSC_DEADLINE(state.record,Date.now());state.date.textContent=d.date_label;state.zone.textContent=d.timezone_label;state.countdown.textContent=d.remaining_label;};state.tick();if(focused&&active?.isConnected){const delta=active.getBoundingClientRect().top-before;if(Math.abs(delta)>1)scrollBy({top:delta,left:0,behavior:'instant'});}};
setInterval(()=>{for(const card of document.querySelectorAll('.summary-card'))card.__summary?.tick();if(dialog?.open&&currentRecord){const view=TSC_DEADLINE(currentRecord,Date.now()),box=dialog.querySelector('.modal-deadline');if(box){box.querySelector('strong').textContent=view.date_label;box.querySelector('.remaining').textContent=view.remaining_label;}}},30000);

})();



(()=>{
 const make=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text??'');if(cls)node.className=cls;return node;};
 let clock=null,generation=0;const cache=new Map(),cardDeadlines=new WeakMap();
 const safeLink=(label,value)=>{const a=make('a',label);try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password){a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';}}catch{}return a;};
 const section=(title,body)=>{const s=make('section',undefined,'detail-section');s.append(make('h2',title),body);return s;};
 const rows=items=>{const dl=make('dl');for(const item of items){const row=make('div',undefined,'detail-row');row.append(make('dt',item.label),make('dd',item.value));dl.append(row);}return dl;};
 function close({updateURL=false}={}){generation++;globalThis.TSC_MODAL?.close();if(clock){clearInterval(clock);clock=null;}const detail=document.getElementById('tender-detail'),browse=document.getElementById('browse-view');if(detail)detail.hidden=true;if(browse)browse.hidden=false;if(updateURL&&globalThis.history&&globalThis.location){const url=new URL(location.href);if(url.searchParams.has('tender')){url.searchParams.delete('tender');history.pushState({},'',url);}}}
 function render(record,presentation,warning=null){
  const panel=document.getElementById('tender-detail');panel.replaceChildren();
  const back=make('button','← Все объявления','detail-back');back.type='button';back.addEventListener('click',()=>{close({updateURL:true});document.getElementById('results')?.scrollIntoView?.({block:'start'});});panel.append(back);
  const hero=make('div',undefined,'detail-hero'),main=make('div',undefined,'detail-hero-main');
  const source=record.source_id==='bidzaar'?'Bidzaar':record.source_id;main.append(make('div',source+(record.number?' · № '+record.number:''),'eyebrow'),make('h1',presentation.title||record.subject));
  const meta=make('div',undefined,'detail-meta');for(const [label,value]of [['Заказчик',record.buyer?.name||'Не указан'],['Место исполнения',record.performance_place?.text||'Не указано'],['Бюджет',record.budget?.amount==null?'Не опубликован':record.budget.amount+' '+(record.budget.currency||'Валюта не подтверждена')]]){const item=make('span',label+' ');item.append(make('strong',value));meta.append(item);}main.append(meta);hero.append(main);
  const deadline=make('aside',undefined,'deadline-box');deadline.setAttribute('aria-label','Срок подачи предложений');const date=make('div',undefined,'deadline-date'),zone=make('div',undefined,'deadline-zone'),remaining=make('span'),countdown=make('div',undefined,'deadline-countdown');remaining.setAttribute('aria-live','polite');const icon=make('span','◷');icon.setAttribute('aria-hidden','true');countdown.append(icon,remaining);deadline.append(make('p','Приём предложений до','deadline-label'),date,zone,countdown);hero.append(deadline);panel.append(hero);
  const update=()=>{const view=globalThis.TSC_DEADLINE(record,Date.now());date.textContent=view.date_label;zone.textContent=view.timezone_label;remaining.textContent=view.remaining_label;deadline.dataset.state=view.state;};update();if(clock)clearInterval(clock);clock=setInterval(update,30000);
  if(warning)panel.append(make('p',warning,'consistency'));
  const status={open:'Приём предложений по данным заказчика',evaluation:'Подведение итогов',completed:'Завершена',cancelled:'Отменена',unknown:'Статус не указан'}[record.source_status?.normalized]||'Статус не указан';main.append(make('p',status+(record.verification!=='detail_verified'?' · Условия не проверены':''),'source-note'));
  const description=make('div');const subject=presentation.subject||[],other=presentation.other_description||[];if(subject.length||other.length){for(const item of [...subject,...other])description.append(make('p',item.label&&item.label!=='Предмет закупки'&&item.label!=='Описание'?item.label+': '+item.value:item.value,'subject-text'));}else description.append(make('p',presentation.description_fallback||record.description||record.subject,'subject-text'));panel.append(section('Предмет закупки',description));
  if(presentation.positions?.length){const list=make('ol',undefined,'position-list');for(const item of presentation.positions){const row=make('li',undefined,'position'),content=make('div');content.append(make('h3',item.name));if(item.description)content.append(make('p',item.description));row.append(make('span',item.ordinal+'.','ordinal'),content,make('span',item.quantity==null?'—':[item.quantity,item.unit].filter(v=>v!=null&&v!=='').join(' '),'position-quantity'));list.append(row);}panel.append(section('Позиции закупки · '+presentation.positions.length,list));}
  if(presentation.commercial_terms?.length)panel.append(section('Коммерческие условия',rows(presentation.commercial_terms)));
  if(presentation.winner_criteria?.length){const body=make('div');for(const item of presentation.winner_criteria)body.append(make('p',item.value,'subject-text'));panel.append(section('Критерии выбора победителя',body));}
  if(presentation.non_price_groups?.length){const body=make('div');for(const group of presentation.non_price_groups){const block=make('div',undefined,'detail-group');block.append(make('h3',group.title));for(const item of group.items){const question=make('div',undefined,'question'),title=make('div',undefined,'question-title');title.append(make('span',item.title),make('span',item.required_label,'required'));question.append(title);if(item.comment)question.append(make('p',item.comment));block.append(question);}body.append(block);}panel.append(section('Неценовые вопросы · '+presentation.non_price_count,body));}
  if(presentation.procedure_rule_groups?.length||presentation.procedure_rules_raw?.length){const body=make('div');for(const group of presentation.procedure_rule_groups||[]){const block=make('div',undefined,'detail-group');block.append(make('h3',group.title),rows(group.items));body.append(block);}for(const note of presentation.source_consistency_notes||[])body.append(make('div',note,'consistency'));body.append(make('p',presentation.procedure_rule_note,'source-note'));if(presentation.procedure_rules_raw?.length){const raw=make('details',undefined,'raw-rules');raw.append(make('summary','Исходные параметры источника'),make('pre',presentation.procedure_rules_raw.map(i=>i.key+': '+i.value).join('\n')));body.append(raw);}panel.append(section('Правила проведения закупки',body));}
  if(presentation.files?.length){const body=make('div');for(const file of presentation.files){const row=make('div',undefined,'file'),info=make('div');info.append(make('strong',file.name),make('p',file.note));row.append(info,make('span',[file.extension?.toUpperCase(),file.size_bytes!=null?file.size_bytes+' байт':null].filter(Boolean).join(' · '),'file-type'));body.append(row);}panel.append(section('Файлы заказчика',body));}
  if(record.contacts?.length){const body=make('div');for(const contact of record.contacts){const values=contact.public_data&&typeof contact.public_data==='object'?Object.values(contact.public_data).filter(Boolean).join(' · '):String(contact.public_data||'');if(values)body.append(make('p',[contact.purpose,values].filter(Boolean).join(': ')));}if(body.children.length)panel.append(section('Публичные контакты',body));}
  const outline=make('nav',undefined,'detail-outline');outline.setAttribute('aria-label','Разделы закупки');
  const detailSections=[...panel.querySelectorAll(':scope>.detail-section')];
  for(const [index,part]of detailSections.entries()){part.id='tender-section-'+index;const link=make('a',part.querySelector('h2').textContent);link.href='#'+part.id;outline.append(link);}
  hero.after(outline);
  const docsSection=detailSections.find(part=>part.querySelector('.file'));
  if(docsSection){const early=make('a','Документы · '+presentation.files.length,'early-documents');early.href='#'+docsSection.id;main.append(early);if(!presentation.positions?.length&&detailSections[0])detailSections[0].after(docsSection);}
  const footer=make('div',undefined,'source-footer');footer.append(safeLink('Открыть публикацию на площадке',presentation.direct_url||record.direct_url),make('span','Проверено: '+(record.checked_at||'Не указано')));panel.append(footer);
 }
 async function loadDetail(record){const key=record.id+'|'+record.checked_at;let value=globalThis.TENDER_DETAILS?.[record.id]||cache.get(key);if(value)return await value;const pending=(async()=>{const response=await fetch('/api/detail?id='+encodeURIComponent(record.id));if(!response.ok)throw Error('detail_http_'+response.status);const detail=await response.json();if(detail.record?.id!==record.id)throw Error('detail_identity_mismatch');return detail;})();cache.set(key,pending);try{return await pending;}catch(error){cache.delete(key);throw error;}}
 function setDeadline(box,record){const value=globalThis.TSC_DEADLINE(record,Date.now());box.querySelector('.deadline-date').textContent=value.date_label;box.querySelector('.deadline-zone').textContent=value.timezone_label;box.querySelector('.deadline-countdown').textContent='◷ '+value.remaining_label;box.dataset.state=value.state;}
 function fallback(record){return {description_fallback:record.description,positions:(record.positions||[]).map((p,i)=>({...p,ordinal:i+1})),files:record.documents||[],non_price_groups:(record.requirements||[]).length?[{title:'Вопросы заказчика',items:record.requirements.map(r=>({...r,required_label:r.required===true?'Обязательно':r.required===false?'Необязательно':'Обязательность не указана'}))}]:[],non_price_count:record.requirements?.length||0};}
 function paintCard(record,presentation,card,options={}){globalThis.TSC_SUMMARY_CARD(record,presentation,card,options);}
 async function renderCard(record,card,options={}){paintCard(record,fallback(record),card,options);try{const detail=await loadDetail(record);if(card.isConnected===false)return;paintCard({...record,...detail.record,service_ids:record.service_ids},detail.presentation,card,options);}catch{if(card.isConnected!==false)card.dataset.detailUnavailable='true';}}
 async function openDialog(record,trigger){close();const session=globalThis.TSC_MODAL.show(record,fallback(record),trigger,'Подробности загружаются; показаны сохранённые сведения.');try{const detail=await loadDetail(record);globalThis.TSC_MODAL.update(session,detail.record,detail.presentation,detail.warning||null);}catch{globalThis.TSC_MODAL.update(session,record,fallback(record),'Исходные доказательства недоступны. Показаны сохранённые сведения; проверьте условия у источника.');}}
 async function open(record,{updateURL=true}={}){
  close();const ticket=generation,panel=document.getElementById('tender-detail'),browse=document.getElementById('browse-view');if(!panel||!browse)return;if(updateURL&&globalThis.history&&globalThis.location){const url=new URL(location.href);url.searchParams.set('tender',record.id);history.pushState({tender:record.id},'',url);}panel.hidden=false;browse.hidden=true;panel.replaceChildren(make('p','Загружаю подробности…','source-note'));panel.scrollIntoView?.({block:'start'});
  try{const detail=await loadDetail(record);if(ticket!==generation)return;render(detail.record,detail.presentation,detail.warning||null);}
  catch{if(ticket!==generation)return;render(record,{title:record.subject,description_fallback:record.description,positions:(record.positions||[]).map((p,i)=>({...p,ordinal:i+1}))},'Подробности из сохранённых доказательств недоступны. Показаны ранее полученные сведения; проверьте условия на площадке.');}
 }
 function bindNavigation(records){const byId=new Map(records.map(record=>[record.id,record]));const restore=()=>{const id=new URL(location.href).searchParams.get('tender'),record=byId.get(id);if(record)open(record,{updateURL:false});else close();};globalThis.addEventListener?.('popstate',restore);restore();}
 globalThis.TSC_DETAIL={open,close,openDialog,renderCard,bindNavigation,invalidate:()=>cache.clear()};
})();

(async()=>{
 const $=id=>document.getElementById(id),make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const link=(label,url)=>{const a=make('a',label);if(/^https:\/\//.test(url||'')){a.href=url;a.target='_blank';a.rel='noopener noreferrer';}return a;};
 const labels={open:'Приём предложений по данным заказчика',evaluation:'Подведение итогов',completed:'Завершено',cancelled:'Отменено',deadline_passed:'Срок истёк',unknown:'Статус не указан'};
 function current(r){return globalThis.TSC_DATES.currentState(r);}
 try{
  const dates=globalThis.TSC_DATES=await import('/tender-dates.js');
  const data=globalThis.TENDER_DATA||await(await fetch('/api/data')).json(),countries=data.countries;
  if(!Array.isArray(countries)||!countries.some(c=>c.id==='RU'))throw Error('Country configuration missing');
  let country=countries.find(c=>c.id===data.default_country_id)||countries.find(c=>c.id==='RU');
  const names=new Map(data.sources.map(s=>[s.id,s.id==='bidzaar'?'Bidzaar':s.name]));
  const fields=['search','source','sort','category','led-category','publication-period','publication-from','publication-to','publication-unknown','activity'],states=new Map(),defaults={sort:'newest','publication-period':'all','publication-unknown':'include',activity:'all'};
  const pageSize=20;let cursor=null,visibleLimit=pageSize;
  let selectedServices=new Set();const categoryInputs=new Map();
  const getField=id=>id==='category'?categories.filter(c=>selectedServices.has(c.id)).map(c=>c.id):$(id).value,setField=(id,value)=>{if(id==='category'){selectedServices=new Set(Array.isArray(value)?value:categories.map(c=>c.id));for(const [key,box]of categoryInputs)box.checked=selectedServices.has(key);$('category-all').checked=selectedServices.size===categories.length;$('category-all').indeterminate=selectedServices.size>0&&selectedServices.size<categories.length;}else $(id).value=value||'';};
  const closing=r=>Number.isFinite(Date.parse(r.deadline.utc))?Date.parse(r.deadline.utc):Infinity;
  function ordering(a,b){const mode=$('sort').value;if(mode==='time_left')return dates.compareTimeRemaining(a,b,{timeZone:country.display_timezone});if(mode==='deadline'){const delta=closing(a)-closing(b);if(!Number.isNaN(delta)&&delta)return delta;}return dates.comparePublication(a,b,country.display_timezone);}
  const countryRecords=()=>country.connected?[...new Map(data.records.filter(r=>r.country_id===country.id).map(r=>[r.id,r])).values()]:[];
  const fmt=s=>s&&Number.isFinite(Date.parse(s))?new Date(s).toLocaleString('ru-RU',{timeZone:country.display_timezone,dateStyle:'short',timeStyle:'short'})+' '+(country.time_suffix||country.timezone_label):'не указано';
  const categories=data.directions||data.categories||[...new Set(data.records.flatMap(r=>r.categories))].map(label=>({id:label,label}));
  const ledCategories=data.led_categories||[];
  const directionNames=new Map(categories.map(c=>[c.id,c.label]));
  for(const category of ledCategories){const option=make('option',category.label);option.value=category.id;$('led-category').append(option);}
  for(const source of data.led_sources||[]){const row=make('li',undefined,'led-source-row'),head=make('div',undefined,'led-source-heading');head.append(link(source.name,source.url),make('span',source.label,source.mode==='automatic'?'pill':'pill warn'));row.append(head,make('p',source.note),make('p',source.contact_label,'small'));$('led-source-list').append(row);}
  defaults.category=categories.map(c=>c.id);
  for(const c of categories){const label=make('label',undefined,'direction-option'),box=make('input');box.type='checkbox';box.value=c.id;box.checked=true;box.addEventListener('change',()=>{if(box.checked)selectedServices.add(c.id);else selectedServices.delete(c.id);setField('category',[...selectedServices]);if(!selectedServices.has('led_screens'))$('led-category').value='';render();});categoryInputs.set(c.id,box);label.append(box,make('span',c.label));$('category').append(label);}
  $('category-all').addEventListener('change',()=>{setField('category',$('category-all').checked?defaults.category:[]);$('led-category').value='';render();});
  function render({more=false}={}){
   if(more&&!cursor)return;
   const all=countryRecords(),q=$('search').value.trim().toLowerCase();
   const dateOptions={period:$('publication-period').value,from:$('publication-from').value,to:$('publication-to').value,unknown:$('publication-unknown').value,timeZone:country.display_timezone};
   const dateWindow=dates.publicationWindow(dateOptions),onlyUnknown=dateOptions.unknown==='only';
   $('publication-range').hidden=dateOptions.period!=='range';
   for(const id of ['publication-period','publication-from','publication-to'])$(id).disabled=onlyUnknown;
   $('publication-error').textContent=onlyUnknown?'':dateWindow.error||'';
   $('publication-timezone').textContent='Сегодня и вчера — по времени '+country.timezone_label+'. Календарные даты без времени сохраняются как указано источником.';
   const baseRows=all.filter(r=>{return (!q||[r.subject,r.description,r.buyer.name,r.number,r.public_number,...(r.source_publications||[]).map(p=>p.number)].join(' ').toLowerCase().includes(q))&&(!$('source').value||r.source_id===$('source').value||(r.source_publications||[]).some(p=>p.source_id===$('source').value))&&(!$('led-category').value||(r.led_category_ids||[]).includes($('led-category').value))&&(r.direction_ids||r.service_ids||[]).some(id=>selectedServices.has(id))&&r.scope_candidate&&dates.matchesActivity(r,$('activity').value);});
   const rows=baseRows.filter(r=>dates.matchesPublication(r,dateOptions)).sort(ordering);
   const unknownCount=baseRows.filter(r=>!dates.publication(r,country.display_timezone).known).length;
   $('publication-count').textContent='С неизвестной датой публикации среди остальных фильтров: '+unknownCount+'. '+(dateOptions.unknown==='include'?('Они включены, но их свежесть не подтверждена.'+($('sort').value==='newest'?' При сортировке «Сначала новые» они в конце списка.':'')):dateOptions.unknown==='only'?'Показаны только они; период не применяется.':'Они скрыты выбранным фильтром.');
   for(const id of ['sort','source']){const control=$(id),option=[...control.children].find(o=>o.value===control.value);$(id+'-choice').textContent=option?option.textContent:'';}
   $('screens-only').setAttribute('aria-pressed',String(selectedServices.size===1&&selectedServices.has('led_screens')));
   const directions=categories.filter(c=>selectedServices.has(c.id));$('category-choice').textContent=directions.length===categories.length?'Все направления':directions.length?directions.length+' выбрано':'Выберите направления';
   const queryKey=JSON.stringify([country.id,...fields.map(id=>[id,getField(id)])]);
   const after=more&&cursor?.query_key===queryKey?rows.findIndex(r=>r.id===cursor.after_id):-1;
   visibleLimit=after>=0?Math.min(rows.length,after+1+pageSize):Math.min(rows.length,pageSize);
   const visible=rows.slice(0,visibleLimit);cursor=visibleLimit<rows.length?{query_key:queryKey,after_id:visible.at(-1).id}:null;
   $('load-more').hidden=!country.connected||!cursor;
   $('load-more').textContent='Показать ещё · '+Math.min(pageSize,rows.length-visibleLimit);
   $('count').textContent=country.connected?'Найдено в собранных данных: '+rows.length+(visible.length<rows.length?' · показано '+visible.length:''):'Источники готовятся к подключению';$('records').replaceChildren();
   if(!country.connected){const empty=make('div',undefined,'empty country-empty');empty.append(make('h3',country.empty_sources_message),make('p','Данные не собирались. Это не означает, что закупок нет.'));$('records').append(empty);return;}
   if(!rows.length)$('records').append(make('div','По этим фильтрам нет объявлений. Попробуйте изменить поиск.','empty'));
   for(const r of visible){
    const s=current(r),c=make('article',undefined,'card'),badges=make('div',undefined,'record-badges');
    c.dataset.recordId=r.id;
    if(r.public_number)badges.append(make('span',r.public_number,'pill'));
    for(const id of (r.direction_ids||[]).filter(id=>['led_screens','signage_letters','outdoor_other'].includes(id)))badges.append(make('span',directionNames.get(id)||id,'pill'));
    if(r.direction_review_required)badges.append(make('span','Состав работ требует проверки','pill warn'));
    for(const requirement of r.led_requirements||[])badges.append(make('span',requirement,'pill warn'));
    for(const id of r.led_category_ids||[]){const category=ledCategories.find(c=>c.id===id);if(category)badges.append(make('span','LED · '+category.label,'pill'));}
    badges.append(make('span',(names.get(r.source_id)||r.source_id)+(r.number?' · №'+r.number:''),'pill'),make('span',s.active?'Можно подать предложение':labels[s.status]||'Статус не указан',s.active?'pill good':'pill warn'));
    if(s.stale)badges.append(make('span','Нужна свежая проверка','pill warn'));if(r.verification!=='detail_verified')badges.append(make('span','Условия не проверены','pill warn'));if(r.procurement_kind==='request_for_price')badges.append(make('span','Запрос цен для НМЦК','pill'));c.append(badges);
    if(globalThis.TSC_DETAIL?.renderCard){globalThis.TSC_DETAIL.renderCard(r,c,{fmt});$('records').append(c);continue;}
    const h=make('h2'),title=link(r.subject,r.direct_url);h.append(title);c.append(h,make('div',r.buyer.name||'Заказчик не указан','meta'));
    const g=make('div',undefined,'grid');for(const [name,value]of [['Место исполнения',r.performance_place.text||'Не указано'],['Предложения до',r.deadline.utc?fmt(r.deadline.utc):r.deadline.raw?r.deadline.raw+' — время и часовой пояс не подтверждены':'Не указано'],['Бюджет',r.budget.amount===null?'Не указан':r.budget.amount.toLocaleString('ru-RU')+' '+(r.budget.currency||'Валюта не подтверждена')],['Направление',(r.service_ids||[]).map(id=>categories.find(c=>c.id===id)?.label||id).join(' · ')||'Другое']]){const cell=make('div',name,'small');cell.append(make('div',value,'value'));g.append(cell);}c.append(g);
    c.append(make('p','Проверено: '+fmt(r.checked_at),'small'));if(r.description)c.append(make('p',r.description,'record-description'));
    const d=make('details');d.append(make('summary','Документы и условия'));
    if(r.source_publications?.length>1)for(const p of r.source_publications){const publication=make('p');publication.append(link((names.get(p.source_id)||p.source_id)+(p.number?' · №'+p.number:''),p.direct_url));d.append(publication);}
    if(r.documents.length){d.append(make('p','Документы по ссылкам заказчика. Содержимое файлов отдельно не проверено.','small'));for(const doc of r.documents){const p=make('p');p.append(doc.public_url?link(doc.name+(doc.extension?'.'+doc.extension:''),doc.public_url):make('span',doc.name));d.append(p);}}else d.append(make('p','Документы не указаны.','small'));
    for(const req of r.requirements||[])d.append(make('p',(req.required?'Обязательно: ':'')+req.title+(req.comment?' — '+req.comment:''),'small'));
    for(const contact of r.contacts||[]){const values=contact.public_data&&typeof contact.public_data==='object'?Object.values(contact.public_data).filter(Boolean).join(' · '):String(contact.public_data||'');if(values)d.append(make('p',[contact.purpose,values].filter(Boolean).join(': '),'small'));}
    if(!r.contacts.length)d.append(make('p','Публичный контакт не указан.','small'));
    d.append(link('Открыть объявление у заказчика',r.direct_url));c.append(d);$('records').append(c);
   }
  }
  function selectCountry(id,{save=true}={}){
   globalThis.TSC_DETAIL?.close?.({updateURL:save});
   const next=countries.find(c=>c.id===id);if(!next)return;
   if(save)states.set(country.id,Object.fromEntries(fields.map(k=>[k,getField(k)])));
   country=next;globalThis.TSC_DISPLAY_TIMEZONE=country.display_timezone;
   const sourceOptions=[make('option','Все площадки')];sourceOptions[0].value='';
   for(const source of data.sources.filter(s=>country.source_ids.includes(s.id)&&data.records.some(r=>r.source_id===s.id&&r.country_id===country.id))){const o=make('option',names.get(source.id)||source.name);o.value=source.id;sourceOptions.push(o);}
   $('source').replaceChildren(...sourceOptions);
   const values=states.get(country.id)||defaults;for(const key of fields)setField(key,values[key]??defaults[key]??'');
   $('country-label').textContent=country.label+(country.scope_label?' · '+country.scope_label:'');
   $('led-sources').hidden=country.id!=='RU';
   $('screens-only').disabled=country.id!=='RU';
   $('country-panel').setAttribute('aria-labelledby','country-'+country.id);$('country-panel').dataset.country=country.id;
   $('timezone-note').textContent='Подтверждённое время отображается в часовом поясе '+country.timezone_label+'. Если зона срока не установлена, сохраняется исходная запись без пересчёта.';
   for(const c of countries){const tab=$('country-'+c.id);if(tab){tab.setAttribute('aria-selected',String(c.id===country.id));tab.tabIndex=c.id===country.id?0:-1;}}
   render();
  }
  countries.forEach((c,i)=>{const tab=$('country-'+c.id);if(!tab)return;tab.addEventListener('click',()=>selectCountry(c.id));tab.addEventListener('keydown',e=>{let index;if(e.key==='ArrowRight')index=(i+1)%countries.length;else if(e.key==='ArrowLeft')index=(i+countries.length-1)%countries.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=countries.length-1;else return;e.preventDefault();selectCountry(countries[index].id);$('country-'+countries[index].id).focus();});});
  for(const id of fields)$(id).addEventListener('input',render);
  $('search-submit').addEventListener('click',render);
  $('screens-only').addEventListener('click',()=>{setField('category',['led_screens']);$('led-category').value='';render();});
  $('led-category').addEventListener('change',()=>{if($('led-category').value)setField('category',['led_screens']);render();});
  $('load-more').addEventListener('click',()=>render({more:true}));
  for(const id of ['sort','source','category']){const panel=$('filter-'+id);panel.addEventListener('keydown',e=>{if(e.key==='Escape'){panel.open=false;panel.querySelector('summary').focus();}});if(id!=='category')$(id).addEventListener('change',()=>{panel.open=false;render();});}
  document.addEventListener('click',e=>{for(const id of ['sort','source','category']){const panel=$('filter-'+id);if(!panel.contains(e.target))panel.open=false;}});
  for(const id of ['sort','source','category'])$('filter-'+id).addEventListener('toggle',()=>{if($('filter-'+id).open)for(const other of ['sort','source','category'])if(other!==id)$('filter-'+other).open=false;});
  selectCountry(country.id,{save:false});
  globalThis.TSC_DETAIL?.bindNavigation?.(data.records);
  try{
   const {mountCollection}=await import('/collection.js');
   mountCollection({data,onSnapshot:fresh=>{Object.assign(data,fresh);globalThis.TSC_DETAIL?.invalidate?.();render();}});
  }catch{ $('refresh-status').textContent='Обновление недоступно: перезагрузите страницу.'; $('refresh-data').disabled=true; }
 }catch(e){$('count').textContent='Не удалось загрузить объявления. Попробуйте обновить страницу.';}
})();
