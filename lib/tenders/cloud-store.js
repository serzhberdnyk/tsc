import {effective,recordCounts,categoryCatalog} from './normalize.js';
import {newTenderItems} from '../../shared/tenders/presentation.js';
import {scheduleView} from './schedule-state.js';
import {hash} from './cloud-http.js';
import {buildSourceRegistry} from '../../shared/tenders/source-registry.js';
import {assertRecordBatch} from '../../shared/tenders/record-contract.js';
import {countryConfigurations,defaultCountryId,countryReadModel} from '../../shared/tenders/countries.js';
import {serviceCatalog} from '../../shared/tenders/service-matching.js';
import {directionCatalog} from '../../shared/tenders/directions.js';
import {serviceReadModel} from '../../shared/tenders/service-projection.js';
import {ledCategories,ledSourceAccess} from '../../shared/tenders/led-opportunities.js';
export const stmt=(db,sql,...values)=>db.prepare(sql).bind(...values);
export async function meta(db,key,fallback=null){const row=await stmt(db,'SELECT data FROM metadata WHERE key=?',key).first();return row?JSON.parse(row.data):fallback;}
export const putMeta=(db,key,value)=>stmt(db,'INSERT INTO metadata(key,data) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET data=excluded.data',key,JSON.stringify(value));
export async function records(db){return (await db.prepare('SELECT data FROM records ORDER BY id').all()).results.map(r=>JSON.parse(r.data));}
export function eventStatement(db,kind,event){const data=JSON.stringify(event);return stmt(db,'INSERT OR IGNORE INTO events(id,kind,at,data) VALUES(?,?,?,?)',hash(kind+data),kind,event.at||'',data);}
export async function snapshot(db,{full=false}={}){
 const [items,sources,status,run,duplicates,authority]=await Promise.all([records(db),meta(db,'sources',[]),meta(db,'status',{}),meta(db,'latest_run'),meta(db,'duplicates',[]),meta(db,'authority')]);
 const logs=async kind=>(await stmt(db,`SELECT data FROM events WHERE kind=? ORDER BY at DESC${full?'':' LIMIT 150'}`,kind).all()).results.map(x=>JSON.parse(x.data));
 const projected=serviceReadModel(countryReadModel(items,sources));
 const registry=buildSourceRegistry({sources,status,records:projected});
 return {generated_at:new Date().toISOString(),countries:countryConfigurations,default_country_id:defaultCountryId,categories:serviceCatalog,directions:directionCatalog,legacy_categories:categoryCatalog,new_tenders:newTenderItems(projected),collection:await meta(db,'latest_batch'),counts:recordCounts(projected),records:full?items:projected.map(r=>({...r,...effective(r)})),sources,status,registry,led_categories:ledCategories,led_sources:ledSourceAccess(registry),run,duplicates,authority,errors:await logs('error'),changes:await logs('change'),...(full?{runs:(await db.prepare('SELECT data FROM runs ORDER BY id').all()).results.map(x=>JSON.parse(x.data))}:{}),schedule:scheduleView(await meta(db,'scheduler'))};
}
export async function acquire(db,owner){const now=Date.now();const r=await stmt(db,"INSERT INTO locks(id,owner,expires_at) VALUES('collector',?,?) ON CONFLICT(id) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at WHERE locks.expires_at < ?",owner,now+120000,now).run();return r.meta.changes===1;}
export async function renew(db,owner){const now=Date.now();const r=await stmt(db,"UPDATE locks SET expires_at=? WHERE id='collector' AND owner=? AND expires_at>?",now+120000,owner,now).run();return r.meta.changes===1;}
export async function release(db,owner){await stmt(db,"DELETE FROM locks WHERE id='collector' AND owner=?",owner).run();}
export async function importSnapshot(db,payload){
 const owner='import-'+crypto.randomUUID();if(!await acquire(db,owner))return {status:409,error:'Сбор или импорт уже выполняется'};
 try{
  const imported=await meta(db,'import_receipt');if(imported)return {status:200,...imported,already_imported:true};
  if((await records(db)).length)throw Error('Не перезаписываем непустую базу');
  assertRecordBatch(payload.records);if(payload.records.length<76||payload.records.length>10000)throw Error('Размер снимка требует проверки');
  if(new Set(payload.records.map(r=>r.id)).size!==payload.records.length)throw Error('Повторяющиеся идентификаторы импорта');
  const receipt={imported_at:new Date().toISOString(),record_count:payload.records.length,ids_sha256:hash(payload.records.map(r=>r.id).sort().join('\n')),snapshot_sha256:hash(JSON.stringify(payload))};
  const writes=payload.records.map(r=>stmt(db,'INSERT INTO records(id,data) VALUES(?,?)',r.id,JSON.stringify(r)));
  writes.push(putMeta(db,'sources',payload.sources),putMeta(db,'status',payload.status),putMeta(db,'latest_run',payload.run),putMeta(db,'duplicates',payload.duplicates||[]),putMeta(db,'authority',{mode:'cloud_primary',since:receipt.imported_at,local:'backup_export_only'}),putMeta(db,'import_receipt',receipt));
  for(const e of payload.errors||[])writes.push(eventStatement(db,'error',e));for(const c of payload.changes||[])writes.push(eventStatement(db,'change',c));
  for(const r of payload.runs||[])writes.push(stmt(db,'INSERT OR IGNORE INTO runs(id,data) VALUES(?,?)',r.run_id,JSON.stringify(r)));
  await db.batch(writes);return {status:200,...receipt};
 }finally{await release(db,owner);}
}
