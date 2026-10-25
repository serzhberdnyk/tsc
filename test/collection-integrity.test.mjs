import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mergeRecords} from '../shared/tenders/model.js';
import {collectAll,collectCloud} from '../lib/tenders/cloud-collect.js';
import {putMeta,meta,records} from '../lib/tenders/cloud-store.js';

const at='2026-10-18T00:00:00.000Z';
const detail={id:'bidzaar:1',source_id:'bidzaar',number:'1',source_record_id:'1',subject:'Поставка видеоэкрана',description:'Проверенные подробности',buyer:{name:'Заказчик'},performance_place:{region_match:'confirmed'},source_status:{code:1,normalized:'open'},deadline:{raw:'2026-12-01T12:00:00Z',utc:'2026-12-01T12:00:00Z'},documents:[{name:'ТЗ.pdf'}],contacts:[{purpose:'Подача',public_data:'public channel'}],requirements:[{title:'Условие'}],verification:'detail_verified',checked_at:at,observed_at:at,evidence:['detail-proof'],warnings:[]};
const list={...detail,subject:'Изменённое название',description:null,verification:'list_only',documents:[],contacts:[],requirements:[],evidence:['list-proof'],checked_at:'2026-10-18T01:00:00.000Z'};
test('repeated list after failed detail refresh retains verified payload, original check time and HOLD state',()=>{
 const first=mergeRecords([detail],[list],list.checked_at).records;
 assert.equal(first[0].verification,'needs_recheck');
 const again=mergeRecords(first,[{...list,checked_at:'2026-10-18T02:00:00.000Z'}],'2026-10-18T02:00:00.000Z');
 for(const key of ['documents','contacts','requirements','description','evidence','checked_at'])assert.deepEqual(again.records[0][key],detail[key],key);
 assert.equal(again.records[0].verification,'needs_recheck');
 assert.equal(again.changes.length,0,'same unresolved list change is not a new verified content change');
});
test('unchanged list updates observation time without renewing detail freshness',()=>{
 const observed='2026-10-18T03:00:00.000Z';const summary={...list,subject:detail.subject,checked_at:observed};
 const [saved]=mergeRecords([detail],[summary],observed).records;
 assert.equal(saved.last_seen_at,observed);assert.equal(saved.checked_at,at);assert.deepEqual(saved.evidence,detail.evidence);
});
test('empty or failing feed does not delete retained records',()=>assert.deepEqual(mergeRecords([detail],[],at).records,[detail]));

class DB{
 constructor(){this.sql=new DatabaseSync(':memory:');this.sql.exec('CREATE TABLE records(id TEXT PRIMARY KEY,data TEXT);CREATE TABLE metadata(key TEXT PRIMARY KEY,data TEXT);CREATE TABLE events(id TEXT PRIMARY KEY,kind TEXT,at TEXT,data TEXT);CREATE TABLE runs(id TEXT PRIMARY KEY,data TEXT);CREATE TABLE locks(id TEXT PRIMARY KEY,owner TEXT,expires_at INTEGER);');}
 prepare(sql){const s=this.sql.prepare(sql);let args=[];const q={bind(...x){args=x;return q},async first(){return s.get(...args)||null},async all(){return {results:s.all(...args)}},async run(){return {meta:{changes:Number(s.run(...args).changes)}}}};return q;}
 async batch(w){this.sql.exec('BEGIN');try{const out=[];for(const x of w)out.push(await x.run());this.sql.exec('COMMIT');return out;}catch(e){this.sql.exec('ROLLBACK');throw e;}}
}
const sources=[{id:'bidzaar',adapter:'bidzaar',enabled:true,url:'https://bidzaar.com/'},{id:'gk_nvm',adapter:'gk_nvm',enabled:true,url:'https://tender.gk-nvm.ru/'}];
async function setup(){const DBinstance=new DB();await putMeta(DBinstance,'import_receipt',{}).run();await putMeta(DBinstance,'sources',sources).run();return {DB:DBinstance,BUCKET:{put:async()=>{}}};}
test('hour boundary resumes unfinished cycle; completed alias is idempotent and no source repeats',async()=>{
 const env=await setup();try{
  await putMeta(env.DB,'status',Object.fromEntries(sources.map(s=>[s.id,{state:'partial',next_retry_at:'2099-01-01T00:00:00Z'}]))).run();
  const deny=async()=>{throw Error('paused source must not be fetched');};
  const first=await collectAll(env,{fetchImpl:deny,now:new Date('2026-10-18T01:59:59Z')});
  assert.equal(first.continue_required,true);assert.deepEqual(first.sources.map(s=>s.source_id),['bidzaar']);
  const second=await collectAll(env,{fetchImpl:deny,now:new Date('2026-10-18T02:00:01Z')});
  assert.equal(second.run_id,first.run_id);assert.equal(second.continue_required,false);assert.deepEqual(second.sources.map(s=>s.source_id),['bidzaar','gk_nvm']);
  const repeated=await collectAll(env,{fetchImpl:deny,now:new Date('2026-10-18T02:00:02Z')});
  assert.equal(repeated.already_completed,true);assert.equal(repeated.run_id,first.run_id);
  assert.equal((await meta(env.DB,'cycle:all-2026-10-18T01')).state,'completed_with_gaps');
  assert.equal((await meta(env.DB,'cycle:all-2026-10-18T02')).state,'completed_with_gaps');
 }finally{env.DB.sql.close();}
});
test('source pause does not block an independent source and network failure preserves saved records',async()=>{
 const env=await setup();try{
  await putMeta(env.DB,'status',{bidzaar:{state:'partial',next_retry_at:'2099-01-01T00:00:00Z'}}).run();
  await env.DB.prepare('INSERT INTO records(id,data) VALUES(?,?)').bind(detail.id,JSON.stringify(detail)).run();
  const calls=[];const failed=async url=>{calls.push(url);return new Response('Unavailable',{status:503});};
  const now=new Date('2026-10-18T03:00:00Z');await collectAll(env,{fetchImpl:failed,now});
  const result=await collectAll(env,{fetchImpl:failed,now});
  assert.equal(calls.length,1);assert.equal(calls[0],'https://tender.gk-nvm.ru/robots.txt');
  assert.equal(result.sources[0].outcome,'skipped');assert.equal(result.sources[1].outcome,'failed');
  assert.deepEqual(await records(env.DB),[detail]);
 }finally{env.DB.sql.close();}
});
test('expired source pause is eligible; retry is enforced by the source itself',async()=>{
 const env=await setup();try{
  await putMeta(env.DB,'status',{bidzaar:{state:'partial',next_retry_at:'2020-01-01T00:00:00Z'}}).run();
  let calls=0;await collectCloud(env,{fetchImpl:async()=>{calls++;return new Response('Unavailable',{status:503});}});
  assert.equal(calls,1);
 }finally{env.DB.sql.close();}
});
