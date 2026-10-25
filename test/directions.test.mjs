import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyLed} from '../shared/tenders/led-opportunities.js';
import {directionCatalog} from '../shared/tenders/directions.js';
import {annotateServices} from '../shared/tenders/service-projection.js';
const record=subject=>({id:'fixture:1',subject,description:'',performance_place:{region_match:'confirmed'},source_status:{normalized:'unknown'},verification:'list_only',alert_state:'HOLD'});
const classify=subject=>annotateServices(record(subject));
test('directions split screens from letters without duplicating the legacy combined direction',()=>{
 const ids=directionCatalog.map(c=>c.id);assert.equal(ids.length,new Set(ids).size);assert.equal(ids.includes('outdoor_signage_led'),false);
 assert.ok(ids.includes('led_screens')&&ids.includes('signage_letters')&&ids.includes('outdoor_other'));
 assert.deepEqual(classify('Изготовление и монтаж световых букв').direction_ids,['signage_letters']);
 assert.deepEqual(classify('Изготовление светодиодного экрана').direction_ids,['led_screens']);
 assert.deepEqual(classify('Изготовление рекламного фриза').direction_ids,['outdoor_other']);
});
test('a mixed screen/signage contract is labelled as mixed, never an exclusive screen manufacture job',()=>{
 const r=classify('Изготовление LED-экрана и световых букв');
 assert.ok(r.direction_ids.includes('led_screens')&&r.direction_ids.includes('signage_letters'));assert.equal(r.direction_review_required,true);
});
for(const subject of ['Поставка LED мониторов','Поставка телевизоров с LED-экраном','Замена светодиодного экрана для монитора','Замена LED-экрана ноутбука','Поставка светодиодных светильников','Изготовление световых букв','Поставка телевизоров LED'])test('consumer device/signage does not become LED: '+subject,()=>assert.equal(classifyLed({subject}).is_led_candidate,false));
for(const [subject,expected] of [
 ['Изготовление светодиодного экрана',['purchase_manufacture']],
 ['Монтаж светодиодного экрана',['requires_review']],
 ['Обслуживание видеоэкрана',['requires_review']],
 ['Модернизация LED-экрана',['repair_modernization']],
 ['Закупка услуг по аренде LED-экрана',['rental']],
 ['Закупка услуг по размещению рекламы на LED-экране',['ad_placement']],
 ['Поставка контроллера для LED-экрана',['repair_modernization']],
 ['Аренда LED-экрана и размещение рекламы на нем',['rental','ad_placement']],
 ['LED-экран. Тип работ не указан',['requires_review']],
 ['LED-экран: аренда не требуется',['requires_review']],
])test('bounded intent: '+subject,()=>assert.deepEqual(classifyLed({subject}).led_category_ids,expected));
test('manufacture plus installation flags the extra requirements without asserting supplier ability',()=>{
 const r=classify('Изготовление и монтаж светодиодного экрана с гарантией и обслуживанием');
 assert.deepEqual(r.led_category_ids,['purchase_manufacture']);assert.equal(r.led_requirements.length,2);assert.equal(r.led_review_required,true);
 assert.equal(r.supplier_eligible,undefined);assert.equal(r.assigned_supplier,undefined);
});
test('read projection preserves the original record and all verification/status fields',()=>{
 const source={...record('Изготовление LED-экрана'),deadline:{raw:null,utc:null},evidence:['proof'],documents:[{name:'original.pdf'}],contacts:[{public_data:'original'}],checked_at:'2020-01-01T00:00:00Z',source_published_at:'2020-01-01',performance_place:{text:'unknown',region_match:'unknown'}};
 const copy=structuredClone(source),out=annotateServices(source);
 assert.deepEqual(source,copy);for(const key of Object.keys(copy))assert.deepEqual(out[key],copy[key],key);
 assert.deepEqual(annotateServices(source),out);
});
