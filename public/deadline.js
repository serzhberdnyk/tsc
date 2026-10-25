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
