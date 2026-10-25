// Country configuration is a read model. It never rewrites legacy record IDs or source facts.
export const countryConfigurations=Object.freeze([
 Object.freeze({id:'RU',namespace:'ru',label:'Россия',flag:'🇷🇺',connected:true,source_ids:['bidzaar','sibur','gk_nvm','nutep','rosmorport_azov_black_sea'],regions:[{id:'sochi',label:'Сочи'},{id:'krasnodar_krai',label:'Краснодарский край'}],display_timezone:'Europe/Moscow',timezone_label:'Москва (UTC+3)',time_suffix:'МСК',currencies:['RUB'],scope_label:'Сочи и Краснодарский край',empty_sources_message:null}),
 Object.freeze({id:'TH',namespace:'th',label:'Таиланд',flag:'🇹🇭',connected:false,source_ids:[],regions:[],display_timezone:'Asia/Bangkok',timezone_label:'Бангкок (UTC+7)',time_suffix:'UTC+7',currencies:['THB'],scope_label:null,empty_sources_message:'Источники Таиланда ещё не подключены'})
]);
export const defaultCountryId='RU';
export function recordCountry(record,sources=[]){
 const explicit=record.country_id,source=sources.find(s=>s.id===record.source_id);
 const declared=source?.country_id||source?.country;
 const known=countryConfigurations.find(c=>c.source_ids.includes(record.source_id))?.id;
 const sourceCountry=countryConfigurations.some(c=>c.id===declared)?declared:known||null;
 if(explicit!==undefined&&(!countryConfigurations.some(c=>c.id===explicit)||sourceCountry&&explicit!==sourceCountry))return null;
 return explicit||sourceCountry;
}
export function countryReadModel(records,sources=[]){return records.map(record=>{const country_id=recordCountry(record,sources);return {...record,country_id,country_namespace:countryConfigurations.find(c=>c.id===country_id)?.namespace||null};});}

