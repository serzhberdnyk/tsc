import {serviceCatalog} from './service-matching.js';
export const directionCatalog=Object.freeze(serviceCatalog.flatMap(service=>service.id==='outdoor_signage_led'?[
 {id:'led_screens',label:'LED / видеоэкраны'},
 {id:'signage_letters',label:'Вывески и световые буквы'},
 {id:'outdoor_other',label:'Прочая наружная реклама · требует проверки'},
]:[service]));

export function classifyDirections(record,serviceIds,led){
 const text=[record.subject,record.description].filter(Boolean).join('\n').normalize('NFKC').replace(/ё/gi,'е');
 const signage=/(?:вывес[а-я]*|(?:объемн|светов)[а-я]*\s+(?:светов[а-я]*\s+)?букв[а-я]*)/i.test(text);
 const other=/(?:рекламн[а-я]*\s+(?:стел|пилон|фриз|конструкци)|билборд|ситиборд|оформлени[а-я]*\s+(?:фасад|витрин))/i.test(text);
 const ids=serviceIds.filter(id=>id!=='outdoor_signage_led');
 if(led.is_led_candidate)ids.push('led_screens');
 if(signage)ids.push('signage_letters');
 if(other||serviceIds.includes('outdoor_signage_led')&&!led.is_led_candidate&&!signage)ids.push('outdoor_other');
 return {direction_ids:[...new Set(ids)],direction_review_required:ids.includes('outdoor_other')||(led.is_led_candidate&&signage),direction_taxonomy_version:1};
}
