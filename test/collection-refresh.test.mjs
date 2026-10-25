import test from 'node:test';
import assert from 'node:assert/strict';
import {createCollectionController,collectionState} from '../public/collection.js';
const response=(body,status=200)=>new Response(JSON.stringify(body),{status});
test('one click completes all source steps and verifies persisted data; double click shares work',async()=>{
 let posts=0,reads=0;const snapshots=[],states=[];
 const batch=()=>({run_id:'run-1',sources:Array.from({length:posts},()=>({outcome:'success'})),finished_at:posts===5?'2026-10-19T12:00:00Z':null});
 const controller=createCollectionController({fetchImpl:async(url,opts)=>{
  if(opts.method==='POST'){posts++;assert.equal(opts.headers['X-Tenders-Action'],'collect');return response(batch());}
  reads++;return response({collection:batch(),records:[{id:'saved-'+posts}],status:{}});
 },onSnapshot:x=>snapshots.push(x),onState:s=>states.push(s)});
 const a=controller.start(),b=controller.start();assert.equal(a,b);await a;
 assert.equal(posts,5);assert.equal(reads,5);assert.equal(snapshots.at(-1).records[0].id,'saved-5');assert.equal(states.at(-1),'success');
});
test('HTTP failures read back before returning and never automatically retry a write',async()=>{
 for(const code of [409,500]){let posts=0,reads=0;const states=[];await createCollectionController({fetchImpl:async(u,o)=>{if(o.method==='POST'){posts++;return response({error:'failure'},code);}reads++;return response({records:[],status:{},collection:{run_id:'old',finished_at:'old',sources:[{outcome:'success'}]}});},onState:s=>states.push(s)}).start();assert.equal(posts,1);assert.equal(reads,1);assert.equal(states.at(-1),code===409?'running':'error');}
});
test('saved partial and failure receipts remain distinct; no new records is not a failure',async()=>{
 assert.equal(collectionState({finished_at:'yes',sources:[{outcome:'success'},{outcome:'failed'}]}),'partial');
 assert.equal(collectionState({finished_at:'yes',sources:[{outcome:'failed'}]}),'error');
 assert.equal(collectionState({finished_at:'yes',sources:[{outcome:'success',records_observed:0}]}),'success');
 let posts=0;const states=[];await createCollectionController({fetchImpl:async(u,o)=>{const collection={run_id:'already',finished_at:'yes',sources:[{outcome:'success'}]};if(o.method==='POST'){posts++;return response({...collection,already_completed:true});}return response({collection,records:[],status:{}});},onState:(s,m)=>states.push(m)}).start();assert.equal(posts,1);assert.match(states.at(-1),/уже выполнена/);
});
test('a receipt whose save cannot be confirmed never claims success',async()=>{
 const states=[];await createCollectionController({fetchImpl:async(u,o)=>response(o.method==='POST'?{run_id:'new'}:{records:[],status:{},collection:{run_id:'old',finished_at:'yes'}}),onState:s=>states.push(s)}).start();assert.equal(states.at(-1),'error');
});
