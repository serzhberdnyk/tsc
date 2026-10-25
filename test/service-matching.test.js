import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceCatalog,matchServices,taxonomy_version} from '../shared/tenders/service-matching.js';
const ids=text=>matchServices(text).service_ids;
const examples={
 outdoor_signage_led:'Поставка и монтаж светодиодного экрана в Краснодаре',
 web_development:'Разработка сайта для производителя насосов и туристического оператора',
 industrial_digital_optimization:'Цифровая оптимизация промышленного предприятия',
 branding_design:'Разработка фирменного стиля и брендбука',
 smm:'Ведение социальных сетей предприятия',
 slim_panels:'Поставка световых SLIM-панелей для витрины',
 print_merch_packaging:'Изготовление сувенирной продукции с нанесением логотипа',
 layouts_brochures:'Дизайн буклета и оригинал-макет',
 magazines_online_media:'Размещение рекламы в журналах',
 marketplace_infographics:'Дизайн карточек товаров для Ozon',
 photo_video:'Фотосъёмка продукции и монтаж видео',
 events_promotions:'Организация фестиваля в Сочи',
 service_robot_rental:'Аренда сервисного робота-официанта BellaBot для ресторана',
 multimedia_interactive:'Разработка контента виртуальной реальности и видеомэппинга',
 small_architectural_forms:'Поставка малых архитектурных форм: скамейки и кашпо',
 trademark_registration:'Сопровождение регистрации товарного знака',
};
test('catalog preserves exactly 16 actual service IDs and source links',()=>{
 assert.equal(serviceCatalog.length,16);assert.equal(new Set(serviceCatalog.map(x=>x.id)).size,16);
 for(const service of serviceCatalog){assert.ok(service.label);assert.ok(service.source_urls.length);assert.ok(service.source_urls.every(x=>x.startsWith('https://ra-xott.com/')));}
});
for(const [id,text] of Object.entries(examples))test('verified service match: '+id,()=>{
 const result=matchServices(text),match=result.matches.find(x=>x.id===id);assert.ok(match,JSON.stringify(result));assert.ok(match.matched_terms.length);assert.equal(result.taxonomy_version,taxonomy_version);assert.deepEqual(match.source_urls,serviceCatalog.find(x=>x.id===id).source_urls);
});
for(const text of [
 'Внедрение ERP MES CRM SCADA и АСУТП',
 'Поставка промышленного манипулятора и робота для сварки',
 'Аренда промышленного робота-манипулятора для ресторана',
 'Разработка RPA программного робота',
 'Оказание юридических услуг по регистрации ООО и патентованию изобретения',
 'Поставка насосов, дробилка ERGON',
 'Закупка на Ozon и Wildberries',
 'Поставка упаковки для реактивов, мешки и еврокубы',
 'Разработка меню питания для пациентов',
 'Поставка телевизоров и светодиодных ламп освещения',
 'Монтаж системы видеонаблюдения и пожарной сигнализации',
 'Разработка навигационного программного обеспечения транспорта',
 'Капитальное строительство промышленного корпуса',
 'Обследование конструкций причала',
 'Техническое обслуживание дизельных двигателей',
 'Аренда виллы и организация туристических экскурсий',
 'AR-артикул VR200 насос',
 'Разработка макета промышленной установки',
])test('no unsupported service inference: '+text,()=>assert.deepEqual(ids(text),[]));
test('multi service overlap is OR with one match per ID and deterministic provenance',()=>{
 const text='Дизайн буклета, печать рекламной продукции и фотосъемка',a=matchServices(text,['Фотосъемка','Полиграфия']);
 for(const id of ['layouts_brochures','print_merch_packaging','photo_video'])assert.ok(a.service_ids.includes(id));
 assert.equal(new Set(a.service_ids).size,a.service_ids.length);assert.deepEqual(a,matchServices(text,['Фотосъемка','Полиграфия']));
});
test('review flags retain inventory and delivery scope uncertainty',()=>{
 for(const id of ['industrial_digital_optimization','small_architectural_forms','service_robot_rental','multimedia_interactive','events_promotions','outdoor_signage_led'])assert.equal(matchServices(examples[id]).matches.find(x=>x.id===id).review_required,true);
});
test('client industry words do not blacklist a real website procurement',()=>{
 assert.ok(ids('Создание сайта для юридической компании и продажи насосов').includes('web_development'));
 assert.ok(ids('SEO туристического портала').includes('web_development'));
 assert.deepEqual(ids('АСУТП'),[]);assert.deepEqual(ids('microSEOlogic'),[]);
});
