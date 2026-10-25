import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyLed,ledSourceAccess,ledCategories} from '../shared/tenders/led-opportunities.js';
import {serviceReadModel} from '../shared/tenders/service-projection.js';
const classify=subject=>classifyLed({subject});
for(const [subject,expected] of [
 ['Поставка и монтаж светодиодного экрана',['purchase_manufacture']],
 ['Аренда LED-экрана на мероприятие',['rental']],
 ['Закупка услуг по ремонту видеоэкрана',['repair_modernization']],
 ['Поставка контроллера для светодиодного экрана',['repair_modernization']],
 ['Размещение рекламных роликов на светодиодном экране',['ad_placement']],
 ['Аренда рекламного места на LED-экране',['ad_placement']],
 ['Поставка LED-экрана и ремонт видеоэкрана',['purchase_manufacture','repair_modernization']],
 ['Поставка LED светильников',[]],
 ['Поставка LED телевизоров',[]],
 ['Замена LED-экрана телевизора',[]],
 ['Поставка световых панелей',[]],
 ['Поставка LED модулей',[]],
 ['Технические характеристики видеоэкрана',['requires_review']],
])test(subject,()=>assert.deepEqual(classify(subject).led_category_ids,expected));
test('five categories; description can establish explicit screen intent',()=>{assert.equal(ledCategories.length,5);assert.deepEqual(classifyLed({subject:'Запрос предложений',description:'Аренда светодиодного экрана'}).led_category_ids,['rental']);});
test('labels never promote historical or unverified records to READY',()=>{const r={id:'old',subject:'Поставка LED-экрана',source_status:{normalized:'completed'},verification:'list_only',alert_state:'HOLD',checked_at:'2020-01-01T00:00:00Z',performance_place:{region_match:'confirmed'}};const [out]=serviceReadModel([r]);assert.deepEqual(out.led_category_ids,['purchase_manufacture']);for(const key of ['alert_state','verification','checked_at','source_status'])assert.deepEqual(out[key],r[key]);});
test('candidate routes never claim automatic collection or paid/free contact access',()=>{for(const source of ledSourceAccess({entries:[]})){assert.equal(source.mode,'manual_review');assert.equal(source.contact_access,'unverified');}assert.equal(ledSourceAccess({entries:[]}).length,6);});
test('only existing enabled adapter can be automatic; stopped status wins',()=>{const entry={id:'bidzaar_own',enabled:true,verification:{adapter:'implemented',fresh:true},availability:{state:'available',stopped:false}};assert.equal(ledSourceAccess({entries:[entry]})[0].mode,'automatic');assert.equal(ledSourceAccess({entries:[{...entry,availability:{stopped:true}}]})[0].mode,'unavailable');assert.equal(ledSourceAccess({entries:[{...entry,id:'etp_gpb'}]}).find(s=>s.id==='etp_gpb').mode,'manual_review');});
