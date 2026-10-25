import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../public/tender-dates.js';
import {publicationDate,newTenderItems} from '../shared/tenders/presentation.js';
import {parseNvmDetail} from '../shared/tenders/public-html.js';
const now=Date.parse('2026-10-19T12:00:00Z');
const at=value=>({id:value,source_id:'bidzaar',source_published_at:value});
const day=value=>({id:value,source_id:'sibur',source_published_raw:value});
test('never substitutes discovery, check, deadline, updated or comment dates for publication',()=>{
 const r={id:'unknown',first_seen_at:'2026-10-19T12:00:00Z',checked_at:'2026-10-19T12:00:00Z',source_updated_at:'2026-10-19T12:00:00Z',deadline:{utc:'2026-10-20T12:00:00Z'},comment:{date:'2026-10-19'}};
 assert.equal(D.publication(r).known,false);assert.equal(publicationDate(r),null);
 assert.equal(D.chronology(r).find(x=>x.key==='discovered').value.includes('19.10.2026'),true);
});
test('strict calendar parsing rejects rollover, missing timezone instants and invalid offsets',()=>{
 for(const raw of ['31.02.2026','29.02.2026','2026-02-30T00:00:00Z','2026-10-19T24:00:00Z','2026-10-19T12:00:00','2026-10-19T12:00:00+14:30','2026-10-19T12:00:00+03:75','19.10.2026 25:00'])assert.equal(D.sourceDate({raw}).known,false,raw);
 assert.equal(D.sourceDate({raw:'29.02.2024'}).known,true);
});
test('calendar-only source date has no invented midnight or timezone',()=>{
 const x=D.publication(day('19.10.2026'),'Asia/Bangkok');assert.equal(x.day,'2026-10-19');assert.equal(x.timestamp,null);assert.equal(x.utc,null);assert.equal(x.precision,'date');
 assert.equal(D.sourceDate({raw:'19.10.2026 13:20:00'}).precision,'local_time');
 assert.match(D.dateLabel(x),/время и часовой пояс не указаны/);
});
test('today and yesterday use selected country timezone, not host timezone',()=>{
 const midnight=Date.parse('2026-10-18T21:00:00Z');
 assert.equal(D.matchesPublication(at('2026-10-18T20:59:59Z'),{period:'today',now:midnight,timeZone:'Europe/Moscow'}),false);
 assert.equal(D.matchesPublication(at('2026-10-18T21:00:00Z'),{period:'today',now:midnight,timeZone:'Europe/Moscow'}),true);
 assert.equal(D.matchesPublication(at('2026-10-18T20:59:59Z'),{period:'yesterday',now:midnight,timeZone:'Europe/Moscow'}),true);
 assert.equal(D.calendarDay('2026-10-18T18:00:00Z','Asia/Bangkok'),'2026-10-19');
 assert.equal(D.calendarDay('2026-10-18T18:00:00Z','Europe/Moscow'),'2026-10-18');
});
test('calendar-day windows survive DST, leap day and year transitions',()=>{
 assert.deepEqual(D.publicationWindow({period:'yesterday',now:Date.parse('2026-03-09T12:00:00Z'),timeZone:'America/New_York'}),{from:'2026-03-08',to:'2026-03-08'});
 assert.deepEqual(D.publicationWindow({period:'7days',now:Date.parse('2027-01-02T12:00:00Z')}),{from:'2026-12-27',to:'2027-01-02'});
 assert.deepEqual(D.publicationWindow({period:'yesterday',now:Date.parse('2024-03-01T12:00:00Z')}),{from:'2024-02-29',to:'2024-02-29'});
});
test('last seven days includes six previous calendar days, not tomorrow or an older day',()=>{
 for(const raw of ['13.10.2026','19.10.2026'])assert.equal(D.matchesPublication(day(raw),{period:'7days',now}),true);
 for(const raw of ['12.10.2026','20.10.2026'])assert.equal(D.matchesPublication(day(raw),{period:'7days',now}),false);
});
test('explicit range includes endpoints and validates both ends',()=>{
 const options={period:'range',from:'2026-10-10',to:'2026-10-19',now};
 assert.equal(D.matchesPublication(day('10.10.2026'),options),true);assert.equal(D.matchesPublication(day('19.10.2026'),options),true);assert.equal(D.matchesPublication(day('20.10.2026'),options),false);
 assert.ok(D.publicationWindow({...options,from:'2026-10-20'}).error);assert.ok(D.publicationWindow({...options,from:''}).error);
 assert.equal(D.matchesPublication({}, {...options,to:''}),false);
});
test('unknown dates are included by default, explicitly excluded or selected alone',()=>{
 const options={period:'today',now};assert.equal(D.matchesPublication({},options),true);assert.equal(D.matchesPublication({},{...options,unknown:'exclude'}),false);assert.equal(D.matchesPublication({},{...options,unknown:'only'}),true);assert.equal(D.matchesPublication(day('19.10.2026'),{...options,unknown:'only'}),false);
});
test('source publication sorting includes raw days and places unknowns last, stable across ties',()=>{
 const records=[{id:'unknown'},day('19.10.2026'),at('2026-10-16T23:00:00Z'),{...day('19.10.2026'),id:'same-day'},at('2026-10-19T07:00:00Z')];
 const sorted=records.toSorted((a,b)=>D.comparePublication(a,b));assert.equal(sorted[0].source_published_at,'2026-10-19T07:00:00Z');assert.equal(sorted.at(-1).id,'unknown');assert.equal(sorted[1].source_published_raw,'19.10.2026');
 for(const a of records)for(const b of records)for(const c of records)if(D.comparePublication(a,b)<=0&&D.comparePublication(b,c)<=0)assert.ok(D.comparePublication(a,c)<=0);
});
test('NVM legacy acceptance start is never displayed as publication; input preserved',()=>{
 const r={id:'gk_nvm:30',source_id:'gk_nvm',source_published_raw:'11.09.2026 18:00',source_fields:{'Дата начала приема заявок':'11.09.2026 18:00'}};const original=JSON.stringify(r);
 assert.equal(D.publication(r).known,false);assert.equal(D.acceptanceStart(r).day,'2026-09-11');assert.equal(D.acceptanceStart(r).timestamp,null);assert.equal(publicationDate(r),null);assert.equal(JSON.stringify(r),original);
});
test('NVM future normalization keeps explicitly labelled acceptance start separate',()=>{
 const listed={id:'gk_nvm:30',source_id:'gk_nvm',number:'30',subject:'Световые вывески',source_published_raw:'11.09.2026 18:00',deadline:{raw:'20.10.2026 18:00'},evidence:[],warnings:[],performance_place:{region_match:'confirmed'}};
 const html='<title>Световые вывески</title>'+[['Дата начала приема заявок','11.09.2026 18:00'],['Дата окончания приема заявок','20.10.2026 18:00']].map(([k,v])=>`<tr class="tender-content-string"><td>${k}</td><td>${v}</td></tr>`).join('');
 const r=parseNvmDetail(html,listed,{url:'https://tender.gk-nvm.ru/site/view-tender?id=30',checkedAt:'2026-10-19T12:00:00Z',evidence:'test'});
 assert.equal(r.source_published_raw,null);assert.equal(r.source_acceptance_start_raw,'11.09.2026 18:00');assert.equal(listed.source_published_raw,'11.09.2026 18:00');
});
test('source status and publication freshness are independent; old open procedures remain accessible',()=>{
 const r={...at('2026-08-01T12:00:00Z'),source_status:{normalized:'open'},deadline:{utc:'2026-11-01T12:00:00Z'},checked_at:'2026-10-19T11:00:00Z',verification:'detail_verified'};
 assert.equal(D.matchesPublication(r,{period:'today',now}),false);assert.equal(D.matchesPublication(r,{period:'all',now}),true);assert.equal(D.matchesActivity(r,'open',now),true);assert.equal(D.matchesActivity(r,'verified',now),true);
 const old={...r,checked_at:'2026-10-16T12:00:00Z'};assert.equal(D.matchesActivity(old,'open',now),true);assert.equal(D.matchesActivity(old,'verified',now),false);assert.equal(D.matchesActivity(old,'review',now),true);
 assert.equal(D.matchesActivity({...r,deadline:{utc:'2026-10-18T12:00:00Z'}},'closed',now),true);
});
test('latest API teaser shares honest publication semantics and excludes future and NVM start dates',()=>{
 const common={scope_match:true,source_status:{normalized:'open'}};
 const values=[{...day('19.10.2026'),...common},{...at('2026-10-16T12:00:00Z'),...common},{...day('20.10.2026'),...common},{...day('19.10.2026'),...common,id:'nvm',source_id:'gk_nvm'}];
 assert.deepEqual(newTenderItems(values,{now:new Date(now)}).map(r=>r.id),['19.10.2026','2026-10-16T12:00:00Z']);
});

test('remaining-time sort puts open distant submission deadlines first, then open unknown, then closed',()=>{
 const r=(id,deadline,status='open')=>({id,source_status:{normalized:status},deadline:{utc:deadline},source_published_at:'2026-10-19T00:00:00Z'});
 const long=r('long','2026-11-19T12:00:00Z'),near=r('near','2026-10-20T12:00:00Z'),unknown=r('unknown',null),expired=r('expired','2026-10-18T12:00:00Z'),cancelled=r('cancelled','2027-01-01T12:00:00Z','cancelled'),uncertain=r('uncertain','2026-12-01T00:00:00Z','unknown');
 unknown.execution_dates_raw={end:'31.12.2099'};unknown.first_seen_at='2099-01-01T00:00:00Z';
 assert.deepEqual([expired,unknown,near,cancelled,uncertain,long].toSorted((a,b)=>D.compareTimeRemaining(a,b,{now})).map(r=>r.id),['long','near','unknown','uncertain','cancelled','expired']);
 assert.equal(D.deadlineSortGroup({...long,source_archived:true},now).rank,3);
 assert.equal(D.deadlineSortGroup({...unknown,deadline:{raw:'20.10.2026',utc:null}},now).rank,1);
 assert.equal(D.deadlineSortGroup({...near,deadline:{utc:new Date(now).toISOString()}},now).rank,3);
 const original=JSON.stringify(long);D.compareTimeRemaining(long,near,{now});assert.equal(JSON.stringify(long),original);
});
test('remaining-time sort is stable and treats invalid deadline instants as unknown',()=>{
 const r=id=>({id,source_status:{normalized:'open'},deadline:{utc:'2026-02-30T12:00:00Z'}});
 assert.equal(D.deadlineSortGroup(r('b'),now).rank,1);assert.deepEqual([r('b'),r('a')].toSorted((a,b)=>D.compareTimeRemaining(a,b,{now})).map(x=>x.id),['a','b']);
});
