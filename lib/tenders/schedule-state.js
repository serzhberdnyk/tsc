export function scheduleView(config,now=Date.now()){
 if(!config)return {enabled:false,provider:null,next_planned_at:null,note:'Расписание не настроено'};
 const start=Date.parse(config.starts_at),step=3600000;
 const next=config.enabled&&Number.isFinite(start)?start+Math.max(0,Math.floor((now-start)/step)+1)*step:null;
 return {...config,next_planned_at:next?new Date(next).toISOString():null,next_run_basis:'Saved hourly Sites schedule; planned time, not proof of execution'};
}
export function validateScheduleConfig(c){
 if(c?.provider!=='sites_cloud_task'||typeof c.task_id!=='string'||!c.task_id||c.task_id.length>200||typeof c.enabled!=='boolean'||c.interval_minutes!==60||c.timezone!=='Asia/Bangkok'||!Number.isFinite(Date.parse(c.starts_at))||!Number.isFinite(Date.parse(c.verified_at)))throw Error('Invalid supported schedule configuration');
 return {provider:c.provider,task_id:c.task_id,enabled:c.enabled,interval_minutes:60,timezone:c.timezone,starts_at:c.starts_at,verified_at:c.verified_at};
}
