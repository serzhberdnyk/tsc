// Presentation-only classifier: no status, deadline, collector or source edits.
export const ledCategories=Object.freeze([
 {id:'purchase_manufacture',label:'Покупка / изготовление'},
 {id:'rental',label:'Аренда'},
 {id:'repair_modernization',label:'Ремонт / модернизация'},
 {id:'ad_placement',label:'Размещение рекламы на экране'},
 {id:'requires_review',label:'Требует проверки'},
]);
const screen=/(?:светодиодн[а-я]*[\s-]+(?:[а-я]+\s+){0,2}(?:экран|диспле|видеостен)|(?:экран|диспле|видеостен)[а-я]*[\s-]+(?:светодиодн|led\b)|\bled[\s-]+(?:экран|диспле|видеостен|screen|display|video\s*wall)|видеоэкран)/i;
const normalize=value=>String(value||'').normalize('NFKC').replace(/ё/gi,'е').replace(/[‐‑–—]/g,'-');
function withoutConsumerScreens(text){
 return text
  .replace(/(?:led[\s-]+|светодиодн[а-я]*\s+)?(?:видеоэкран|экран|диспле)[а-я]*\s+(?:для\s+)?(?:телевизор|монитор|ноутбук|телефон|смартфон)[а-я]*/gi,'')
  .replace(/(?:телевизор|монитор|ноутбук|телефон|смартфон)[а-я]*\s+(?:с\s+)?(?:led[\s-]+|светодиодн[а-я]*\s+)?(?:экран|диспле)[а-я]*/gi,'');
}
function positive(clause,pattern){
 const match=clause.match(pattern);if(!match)return false;
 const before=clause.slice(Math.max(0,match.index-12),match.index),after=clause.slice(match.index+match[0].length,match.index+match[0].length+30);
 return !/(?:^|\s)(?:не|без|кроме)\s*$/i.test(before)&&!/^\s+(?:не требуется|не предусмотрен|не входит)/i.test(after);
}
export function classifyLed(record){
 const text=normalize([record.subject,record.description].filter(Boolean).join('\n'));
 const objectText=withoutConsumerScreens(text);
 const clauses=objectText.split(/[.;\n]+/).filter(s=>screen.test(s));
 if(!clauses.length)return {is_led_candidate:false,led_category_ids:[],led_requirements:[],led_review_required:false,led_classification_version:2};
 const ids=new Set(),requirements=new Set();
 for(const clause of clauses){
  const ad=positive(clause,/(?:размещени|показ|трансляци|прокат)[а-я]*\s+(?:[а-я]+\s+){0,3}(?:реклам|ролик)|(?:рекламн[а-я]*\s+)?эфирн[а-я]*\s+врем|(?:аренд[а-я]*\s+)?рекламн[а-я]*\s+(?:мест|площад)/i);
  const repair=positive(clause,/(?:ремонт|модернизаци|реконструкци|замен[а-я]*\s+(?:модул|блок|контроллер)|комплектующ|запасн[а-я]*\s+част|(?:модул|контроллер|блок[а-я]*\s+питани)[а-я]*\s+для)/i);
  const rental=positive(clause,/(?:аренд|прокат)[а-я]*\s+(?:светодиодн[а-я]*\s+(?:экран|диспле)|led[\s-]+(?:экран|screen)|видеоэкран)/i)||!ad&&positive(clause,/(?:аренд|прокат)[а-я]*/i);
  if(ad)ids.add('ad_placement');if(repair)ids.add('repair_modernization');if(rental)ids.add('rental');
  // Purchase must name the screen as the purchased object, not repair services or components.
  if(positive(clause,/(?:покупк|закупк|поставк|приобретени|изготовлени|производств)[а-я]*\s+(?:и\s+монтаж[а-я]*\s+)?(?:(?:наружн|уличн|модульн|рекламн|интерьерн)[а-я]*\s+){0,2}(?:светодиодн[а-я]*\s+(?:экран|диспле|видеостен)|led[\s-]+(?:экран|диспле|screen)|видеоэкран|экран[а-я]*\s+led)/i))ids.add('purchase_manufacture');
 }
 // These are buyer requirements, never capabilities attributed to a supplier.
 if(positive(objectText,/(?:монтаж|демонтаж|установк|подключени)[а-я]*/i))requirements.add('Монтаж / подключение: требуется отдельная проверка');
 if(positive(objectText,/(?:обслуживани|гаранти)[а-я]*/i))requirements.add('Гарантия / обслуживание: требуется отдельная проверка');
 if(!ids.size)ids.add('requires_review');
 return {is_led_candidate:true,led_category_ids:ledCategories.filter(c=>ids.has(c.id)).map(c=>c.id),led_requirements:[...requirements],led_review_required:ids.has('requires_review')||requirements.size>0,led_classification_version:2};
}

// Manual routes are never inserted into the collector configuration or READY feed.
const sourcePolicies=Object.freeze([
 {id:'bidzaar_own',name:'Bidzaar',url:'https://bidzaar.com/app/requests/public/buy',existing_adapter:true,note:'Действующий публичный HTML-адаптер, частичный охват. Только текущее приватное использование. Connector API не подключён: нужны ключ и акцепт. Разрешение на коммерческую перепубликацию не установлено.'},
 {id:'b2b_own',name:'B2B-Center',url:'https://www.b2b-center.ru/market/',note:'Ручной просмотр. Разрешённый автоматический канал и его условия не подтверждены.'},
 {id:'etp_gpb',name:'ЭТП ГПБ',url:'https://etpgpb.ru/procedures/',note:'Ручной просмотр. Работоспособность RSS и условия его использования не подтверждены.'},
 {id:'eis',name:'ЕИС',url:'https://zakupki.gov.ru/epz/main/public/home.html',note:'Ручной просмотр. Анонимный канал сбора не подтверждён; доступы и ключи не создаются.'},
 {id:'rts_sochi_small',name:'РТС',url:'https://sochi.rts-tender.ru/',note:'Ручной просмотр. Список и разрешённый канал сбора не подтверждены.'},
 {id:'sochi_belarus',name:'Санаторий «Беларусь»',url:'https://www.sochi-belarus.ru/tenders',note:'Официальный раздел для ручного просмотра. Автоматический канал не проверен; архивные примеры не добавлены в актуальные заявки.'},
]);
export function ledSourceAccess(registry){
 return sourcePolicies.map(policy=>{
  const entry=registry?.entries?.find(e=>e.id===policy.id);
  const automatic=policy.existing_adapter===true&&entry?.enabled===true&&entry.verification?.adapter==='implemented';
  const stopped=entry?.availability?.stopped===true;
  const healthy=['available','degraded'].includes(entry?.availability?.state);
  const fresh=entry?.verification?.fresh===true;
  const mode=stopped?'unavailable':automatic?'automatic':'manual_review';
  const label=stopped?'Недоступен для сбора':automatic?(healthy&&fresh?'Автосбор · частичный охват':'Автосбор настроен · нужна проверка'):'Ручной просмотр · сбор не подключён';
  return {...policy,mode,label,contact_access:'unverified',contact_label:'Доступ к контакту не проверен',last_checked_at:entry?.availability?.checked_at||null};
 });
}
