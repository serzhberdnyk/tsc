import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as dates from '../public/tender-dates.js';
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.value='';this.events={};this.attributes={};this.dataset={};this.textContent='';this.hidden=false;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
 setAttribute(name,value){this.attributes[name]=value;}
 fire(name){for(const fn of this.events[name]||[])fn({target:this});}
 contains(){return false;}
}
async function harness(){
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,new Element('div'));return nodes.get(id);};
 for(const [id,options]of Object.entries({sort:[['newest','Сначала новые'],['deadline','Срок подачи ближе']],source:[['','Все площадки']]}))for(const [value,label]of options){const o=new Element('option');o.value=value;o.textContent=label;get(id).append(o);}
 const today=dates.calendarDay(Date.now()),yesterday=dates.publicationWindow({period:'yesterday'}).from;
 const record=(id,date,direction='led_screens')=>({id,country_id:'RU',source_id:'bidzaar',source_published_date:date,subject:id,description:'',buyer:{name:'Buyer'},scope_candidate:true,direction_ids:[direction],led_category_ids:direction==='led_screens'?['purchase_manufacture']:[],performance_place:{text:'Краснодар'},source_status:{normalized:'open'},deadline:{utc:'2099-01-01T00:00:00Z'},checked_at:new Date().toISOString(),verification:'detail_verified'});
 const data={countries:[{id:'RU',connected:true,display_timezone:'Europe/Moscow',timezone_label:'Москва',source_ids:['bidzaar']},{id:'TH',connected:false,display_timezone:'Asia/Bangkok',timezone_label:'Бангкок',source_ids:[]}],sources:[{id:'bidzaar'}],directions:[{id:'led_screens',label:'Экраны'},{id:'signage_letters',label:'Вывески'}],led_categories:[{id:'purchase_manufacture',label:'Покупка'}],records:[record('old',yesterday),record('new',today),record('unknown',null),record('sign',today,'signage_letters')]};
 const context={TENDER_DATA:data,__dates:dates,Date,Map,Set,URL,console,document:{getElementById:get,createElement:t=>new Element(t),addEventListener(){}},TSC_DETAIL:{renderCard(){},bindNavigation(){},invalidate(){},close(){}},fetch(){throw Error('No external collection or fetch allowed');}};
 const file=readFileSync(new URL('../public/tenders.js',import.meta.url),'utf8');
 const main=file.slice(file.lastIndexOf('(async()=>{')).replace("await import('/tender-dates.js')",'__dates').replace("await import('/collection.js')",'({mountCollection(){}})');
 vm.createContext(context);await vm.runInContext(main,context);
 const ids=()=>get('records').children.filter(e=>e.dataset.recordId).map(e=>e.dataset.recordId);
 const choose=(id,value,event='input')=>{get(id).value=value;get(id).fire(event);};
 return {get,ids,choose,data};
}
test('actual client filters combine publication, unknown dates, direction and status without source requests',async()=>{
 const h=await harness();assert.deepEqual(h.ids(),['new','sign','old','unknown']);
 h.choose('publication-period','today');assert.deepEqual(h.ids(),['new','sign','unknown']);assert.match(h.get('publication-count').textContent,/1/);
 h.choose('publication-unknown','exclude');assert.deepEqual(h.ids(),['new','sign']);
 h.get('screens-only').fire('click');assert.deepEqual(h.ids(),['new']);
 h.choose('publication-unknown','only');assert.deepEqual(h.ids(),['unknown']);assert.equal(h.get('publication-period').disabled,true);
 h.choose('publication-unknown','include');h.choose('publication-period','all');h.choose('activity','open');assert.deepEqual(h.ids(),['new','old','unknown']);
 h.choose('activity','closed');assert.deepEqual(h.ids(),[]);
});
test('actual client validates ranges and clears a stale LED subfilter when screens are deselected',async()=>{
 const h=await harness();h.choose('publication-period','range');assert.match(h.get('publication-error').textContent,/обе даты/);assert.deepEqual(h.ids(),[]);
 h.choose('publication-period','all');h.choose('led-category','purchase_manufacture','change');assert.deepEqual(h.ids(),['new','old','unknown']);
 const boxes=h.get('category').children.map(label=>label.children[0]);
 boxes.find(e=>e.value==='signage_letters').checked=true;boxes.find(e=>e.value==='signage_letters').fire('change');
 boxes.find(e=>e.value==='led_screens').checked=false;boxes.find(e=>e.value==='led_screens').fire('change');
 assert.equal(h.get('led-category').value,'');assert.deepEqual(h.ids(),['sign']);
});
test('country switch preserves separate filter state and explicit timezone labels',async()=>{
 const h=await harness();h.choose('publication-period','yesterday');h.choose('publication-unknown','exclude');assert.deepEqual(h.ids(),['old']);
 h.get('country-TH').fire('click');assert.deepEqual(h.ids(),[]);assert.match(h.get('publication-timezone').textContent,/Бангкок/);assert.equal(h.get('screens-only').disabled,true);
 h.get('country-RU').fire('click');assert.equal(h.get('publication-period').value,'yesterday');assert.equal(h.get('publication-unknown').value,'exclude');assert.deepEqual(h.ids(),['old']);
});

test('client exposes remaining-time sort and orders distant open deadlines above nearer or expired',async()=>{
 const h=await harness();h.data.records.find(r=>r.id==='new').deadline.utc='2099-02-01T00:00:00Z';h.data.records.find(r=>r.id==='old').deadline.utc='2000-01-01T00:00:00Z';h.data.records.find(r=>r.id==='unknown').deadline.utc=null;
 h.choose('sort','time_left');assert.deepEqual(h.ids(),['new','sign','unknown','old']);
 const html=readFileSync(new URL('../lib/tenders/page-html.ts',import.meta.url),'utf8');assert.ok(html.includes('Больше времени до окончания приёма заявок'));
});
