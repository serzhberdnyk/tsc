export function collectionState(batch){
 if(!batch)return 'idle';
 if(!batch.finished_at)return 'running';
 const sources=batch.sources||[];
 if(sources.length&&sources.every(s=>s.outcome==='success'))return 'success';
 return sources.some(s=>s.outcome==='success')?'partial':'error';
}

export function createCollectionController({fetchImpl=fetch,onSnapshot=()=>{},onState=()=>{}}={}){
 let pending=null;
 const request=async(url,options)=>{
  const response=await fetchImpl(url,{cache:'no-store',signal:AbortSignal.timeout(45000),...options});
  const body=await response.json();
  if(!response.ok)throw Object.assign(Error(body.error||'Не удалось выполнить запрос'),{status:response.status});
  return body;
 };
 const read=async()=>{
  const data=await request('/api/data');
  if(!Array.isArray(data.records)||!data.status)throw Error('Ответ не содержит сохранённых данных');
  onSnapshot(data);return data;
 };
 async function execute(){
  let runId=null;
  onState('running','Проверяю источники…');
  try{
   for(let step=0;step<5;step++){
    const receipt=await request('/api/collect?source=all',{method:'POST',headers:{'X-Tenders-Action':'collect'}});
    if(!receipt.run_id)throw Error('Не получено подтверждение запуска');
    if(runId&&receipt.run_id!==runId)throw Error('Изменился идентификатор проверки; перечитайте состояние');
    runId=receipt.run_id;
    const saved=await read(),batch=saved.collection;
    if(batch?.run_id!==runId)throw Error('Сохранение текущей проверки не подтверждено');
    if(batch.finished_at){
     const state=collectionState(batch);
     const prefix=receipt.already_completed?'Проверка за текущий час уже выполнена. ':'';
     onState(state,prefix+({success:'Проверка завершена. Данные сохранены; охват неполный.',partial:'Проверка завершена частично. Данные сохранены; есть ошибки источников.',error:'Проверка не дала успешного результата. Ранее сохранённые данные доступны.'}[state]));
     return saved;
    }
    onState('running','Проверено источников: '+(batch.sources?.length||0)+' из 5…');
   }
   throw Error('Проверка не завершена. Можно продолжить её кнопкой обновления.');
  }catch(error){
   // Read an uncertain write before any user-initiated retry; never retry POST blindly.
   let saved;try{saved=await read();}catch{}
   if(runId&&saved?.collection?.run_id===runId&&saved.collection.finished_at){
    onState(collectionState(saved.collection),'Результат проверки подтверждён повторным чтением.');return saved;
   }
   onState(error.status===409?'running':'error',error.status===409?'Другая проверка уже выполняется. Повторите чтение позже; новый сбор не запущен.':'Не удалось подтвердить завершение: '+error.message+' Сохранённые данные не удалены.');
   return saved||null;
  }
 }
 return {start(){if(pending)return pending;pending=execute().finally(()=>{pending=null;});return pending;},read};
}

export function mountCollection({data,onSnapshot}){
 const $=id=>document.getElementById(id),button=$('refresh-data'),status=$('refresh-status');
 const fmt=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',dateStyle:'short',timeStyle:'short'})+' МСК':'не подтверждено';
 const render=fresh=>{
  const batch=fresh.collection;
  $('refresh-time').textContent='Последняя попытка: '+fmt(batch?.started_at)+' · Завершение: '+fmt(batch?.finished_at)+' · Последний проход без ошибок: '+fmt(batch?.last_successful_batch_at)+'. Полный охват не подтверждён.';
  const schedule=fresh.schedule;
  $('schedule-status').textContent=schedule?.enabled?'Расписание: включено по последней проверке '+fmt(schedule.verified_at)+'. Выполнение подтверждается только временем прохода.':'Расписание: '+(schedule?.provider?'выключено по последней проверке '+fmt(schedule.verified_at):'не подтверждено')+'.';
  const rows=(fresh.sources||[]).filter(s=>s.enabled&&fresh.status?.[s.id]).map(source=>{
   const st=fresh.status[source.id],result=batch?.sources?.find(s=>s.source_id===source.id),li=document.createElement('li');
   const name=source.id==='bidzaar'?'Bidzaar':source.name||source.id;
   const state=batch?.current_source_id===source.id?'проверяется':result?.outcome==='skipped'?'пропущен: '+(result.reason||'источник на паузе'):st.last_error?'ошибка: '+st.last_error.code:st.state==='available_partial'?'прочитан, охват неполный':'проверка не подтверждена';
   li.textContent=name+' — '+state+'. Попытка: '+fmt(st.last_attempt_at||st.checked_at)+'; успешное чтение: '+fmt(st.last_success_at)+'. '+(st.last_error?'Число закупок по ошибке не определяется. ':'Наблюдений в последней проверке: '+(st.records_observed??'неизвестно')+'. ')+(st.next_retry_at?'Пауза до '+fmt(st.next_retry_at)+'. ':'')+'Полный охват и актуальность всех карточек не подтверждены.';
   return li;
  });
  $('collection-sources').replaceChildren(...rows);
 };
 const setState=(state,message)=>{status.textContent=message;button.closest('section').dataset.state=state;};
 render(data);
 setState(collectionState(data.collection),data.collection?.state==='running'?'Есть незавершённая проверка. Кнопка продолжит её.':'Отображаются сохранённые данные. Кнопка проверит источники.');
 const controller=createCollectionController({onSnapshot:fresh=>{render(fresh);onSnapshot(fresh);},onState:setState});
 button.addEventListener('click',async()=>{if(button.disabled)return;button.disabled=true;button.textContent='Обновление…';try{await controller.start();}finally{button.disabled=false;button.textContent='Обновить данные';}});
 return controller;
}
