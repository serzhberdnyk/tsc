import taxonomy from './ra-taxonomy.json' with {type:'json'};

export const taxonomy_version=`ra-${taxonomy.source.site_version}-${taxonomy.source.git_commit}-matcher-1`;
const urls=s=>[...new Set([s.entry_url,s.page_url,...(s.page_urls||[]),...(s.related_page_urls||[])].filter(Boolean))];
export const serviceCatalog=Object.freeze(taxonomy.services.map(s=>Object.freeze({id:s.id,label:s.site_title,source_urls:Object.freeze(urls(s))})));
const norm=value=>String(value??'').normalize('NFKC').replace(/ё/g,'е').replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim();
const word=pattern=>new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`,'giu');
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Curated object-specific stems. These identify a possible service, not supplier
// eligibility, available inventory or confirmed ability to execute the whole tender.
const rules={
 outdoor_signage_led:{patterns:['наружн[а-я]* реклам[а-я]*','(?:светов[а-я]* )?вывес[а-я]*','объемн[а-я]* букв[а-я]*','(?:led|светодиодн[а-я]*)[- ](?:экран[а-я]*|диспле[а-я]*)','видеоэкран[а-я]*','рекламн[а-я]* (?:стел[а-я]*|пилон[а-я]*|фриз[а-я]*|конструкци[а-я]*)','оформлени[а-я]* (?:фасад[а-я]*|витрин[а-я]*)','билборд[а-я]*','ситиборд[а-я]*','dooh'],review:true},
 web_development:{patterns:['(?:разработк[а-я]*|создани[а-я]*|поддержк[а-я]*|адаптаци[а-я]*|модернизаци[а-я]*|локализаци[а-я]*) (?:[а-я-]+ ){0,3}(?:веб[- ]?)?сайт[а-я]*','(?:корпоративн[а-я]*|b2b)[- ]сайт[а-я]*','интернет[- ]магазин[а-я]*','лендинг[а-я]*','seo','поисков[а-я]* продвижени[а-я]*']},
 industrial_digital_optimization:{patterns:['цифров[а-я]* оптимизаци[а-я]* (?:промышленн[а-я]* )?предприяти[а-я]*','оптимизаци[а-я]* рабочих процессов'],review:true},
 branding_design:{patterns:['брендинг[а-я]*','ребрендинг[а-я]*','айдентик[а-я]*','(?:разработк[а-я]*|дизайн[а-я]*|создани[а-я]*) (?:[а-я-]+ ){0,2}логотип[а-я]*','фирменн[а-я]* стил[а-я]*','брендбук[а-я]*','нейминг[а-я]*','дизайн рекламн[а-я]* материал[а-я]*']},
 smm:{patterns:['smm','ведени[а-я]* (?:социальн[а-я]* сет[а-я]*|соцсет[а-я]*|аккаунт[а-я]*)','продвижени[а-я]* в социальн[а-я]* сет[а-я]*','контент для соцсет[а-я]*','рилс[а-я]* для социальн[а-я]* сет[а-я]*']},
 slim_panels:{patterns:['(?:светов[а-я]* )?slim[- ]панел[а-я]*','кристаллайт[а-я]*','фреймлайт[а-я]*','магнетик[а-я]*','светов[а-я]* рекламн[а-я]* панел[а-я]*'],gate:t=>!/\bslim\b/i.test(t)||/панел/i.test(t)},
 print_merch_packaging:{patterns:['полиграфи[а-я]*','печат[а-я]* рекламн[а-я]* продукци[а-я]*','(?:изготовлени[а-я]*|печат[а-я]*|поставк[а-я]*) (?:[а-я-]+ ){0,2}(?:листов[а-я]*|визит[а-я]*|буклет[а-я]*|брошюр[а-я]*|календар[а-я]*)','сувенирн[а-я]* продукци[а-я]*','нанесени[а-я]* логотип[а-я]*','брендированн[а-я]* продукци[а-я]*','дизайн упаковк[а-я]*','(?:печат[а-я]*|брендировани[а-я]*) упаковк[а-я]*']},
 layouts_brochures:{patterns:['(?:разработк[а-я]*|дизайн[а-я]*) (?:[а-я-]+ ){0,2}макет[а-я]*','оригинал[- ]макет[а-я]*','(?:верстк[а-я]*|дизайн[а-я]*) (?:[а-я-]+ ){0,2}(?:буклет[а-я]*|брошюр[а-я]*|каталог[а-я]*|полиграфи[а-я]*)','рекламн[а-я]* макетировани[а-я]*']},
 magazines_online_media:{patterns:['размещени[а-я]* реклам[а-я]* в сми','рекламн[а-я]* (?:стать[а-я]*|полос[а-я]*)','нативн[а-я]* реклам[а-я]*','(?:баннерн[а-я]* реклам[а-я]*|медиаразмещени[а-я]*) в (?:онлайн[- ]сми|интернет[- ]издани[а-я]*)','(?:размещени[а-я]*|публикаци[а-я]*) (?:[а-я-]+ ){0,2}(?:реклам[а-я]*|пресс[- ]релиз[а-я]*) в (?:журнал[а-я]*|онлайн[- ]медиа|интернет[- ]издани[а-я]*)'],review:true},
 marketplace_infographics:{patterns:['инфографик[а-я]* для маркетплейс[а-я]*','(?:дизайн[а-я]*|оформлени[а-я]*|создани[а-я]*) карточ[а-я]* товар[а-я]*','товарн[а-я]* инфографик[а-я]*','контент для маркетплейс[а-я]*','обработк[а-я]* товарн[а-я]* фотографи[а-я]*']},
 photo_video:{patterns:['фотосъем[а-я]*','видеосъем[а-я]*','фотопроизводств[а-я]*','видеопроизводств[а-я]*','предметн[а-я]* съем[а-я]*','монтаж видео','рекламн[а-я]* ролик[а-я]*','сценари[а-я]* ролик[а-я]*','контент для экран[а-я]*']},
 events_promotions:{patterns:['организаци[а-я]* (?:[а-я-]+ ){0,3}(?:мероприяти[а-я]*|фестивал[а-я]*|конференци[а-я]*)','промоакци[а-я]*','флешмоб[а-я]*','оформлени[а-я]* (?:мероприяти[а-я]*|событи[а-я]*)','реклам[а-я]* на (?:телевидени[а-я]*|радио)','размещени[а-я]* (?:[а-я-]+ ){0,2}ролик[а-я]* на тв','эфирн[а-я]* размещени[а-я]*','трансляци[а-я]* рекламн[а-я]* ролик[а-я]*'],review:true},
 service_robot_rental:{patterns:['аренд[а-я]* (?:сервисн[а-я]* )?робот[а-я-]*','аренд[а-я]* bellabot','робот[а-я]* для мероприяти[а-я]*','брендировани[а-я]* робот[а-я]*'],gate:t=>/(?:сервисн|официант|bellabot|мероприяти|конференци|выставк|свадьб|гостиниц|ресторан)/i.test(t),review:true},
 multimedia_interactive:{patterns:['дополненн[а-я]* реальност[а-я]*','виртуальн[а-я]* реальност[а-я]*','видеомэппинг[а-я]*','фасадн[а-я]* проекци[а-я]*','голограмм[а-я]*','голографическ[а-я]* проекци[а-я]*','интерактивн[а-я]* стол[а-я]*','видеопроекци[а-я]*','светодиодн[а-я]* фотозон[а-я]*','(?:ar|vr)[- ](?:контент|инсталляци[а-я]*|технологи[а-я]*|экспозици[а-я]*)'],review:true},
 small_architectural_forms:{patterns:['мал[а-я]* архитектурн[а-я]* форм[а-я]*','маф','бесед[а-я]*','скамей[а-я]*','лавоч[а-я]*','детск[а-я]* площад[а-я]*','пергол[а-я]*','велопарков[а-я]*','кашпо','парков[а-я]* фигур[а-я]*','топиар[а-я]*'],review:true},
 trademark_registration:{patterns:['(?:регистраци[а-я]*|проверк[а-я]*) товарн[а-я]* знак[а-я]*','(?:заявк[а-я]*|сопровождени[а-я]*) (?:[а-я-]+ ){0,3}роспатент[а-я]*','подбор классов мкту']},
};
// Short or generic catalogue aliases are deliberately not standalone search rules.
const ambiguous=/^(?:ar|vr|ozon|wildberries|aliexpress|яндекс маркет|упаковка|меню|каталоги|верстка|буклет|световая панель|мультимедиа|интерактив|спецпроект|товарный знак|слоган|ведения аккаунтов)$/i;
const blockedAliasServices=new Set(['industrial_digital_optimization','marketplace_infographics','service_robot_rental','print_merch_packaging','layouts_brochures','multimedia_interactive']);
export function matchServices(input,tags=[]){
 const content=norm(input),parts=[content,...tags.map(norm)],matches=[];
 for(const service of taxonomy.services){
  const rule=rules[service.id];if(!rule)continue;
  const patterns=[...rule.patterns];
  if(!blockedAliasServices.has(service.id))patterns.push(...(service.procurement_synonyms||[]).map(norm).filter(s=>!ambiguous.test(s)).map(escape));
  const matched=new Set();
  for(const part of parts){
   if(rule.gate&&!rule.gate(part))continue;
   if(service.id==='service_robot_rental'&&/(?:промышленн|манипулятор|свароч|\brpa\b)/i.test(part)&&!/(?:сервисн|официант|bellabot)/i.test(part))continue;
   if(service.id==='layouts_brochures'&&/(?:макет[а-я]* (?:[а-я-]+ ){0,2}(?:сайт|здани|станк|двигател|установк)|промышленн[а-я]* макет)/i.test(part)&&!/(?:полиграф|буклет|брошюр|рекламн[а-я]* макет)/i.test(part))continue;
   for(const pattern of patterns)for(const hit of part.matchAll(word(norm(pattern))))matched.add(hit[0]);
  }
  if(matched.size)matches.push({id:service.id,matched_terms:[...matched].sort(),source_urls:urls(service),review_required:!!rule.review});
 }
 return {service_ids:matches.map(x=>x.id),matches,taxonomy_version};
}
