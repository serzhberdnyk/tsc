import {matchServices} from './service-matching.js';
import {classifyLed} from './led-opportunities.js';
import {classifyDirections} from './directions.js';

// Derived service tags never rewrite source facts or the legacy classification.
export function annotateServices(record){
 const tags=[...(Array.isArray(record.tags)?record.tags:[]),record.source_category].filter(x=>typeof x==='string');
 const matched=matchServices([record.subject,record.description].filter(Boolean).join('\n'),tags);
 const region=record.performance_place?.region_match;
 const led=classifyLed(record);
 return {...record,...led,...classifyDirections(record,matched.service_ids,led),service_ids:matched.service_ids,service_matches:matched.matches,service_taxonomy_version:matched.taxonomy_version,
  service_scope_candidate:matched.service_ids.length>0&&region!=='outside',
  service_scope_match:matched.service_ids.length>0&&region==='confirmed'};
}

// One record stays one result even when several services match (OR semantics).
export function serviceReadModel(records){return records.map(record=>{
 const annotated=annotateServices(record);
 return {...annotated,legacy_scope_candidate:record.scope_candidate,legacy_scope_match:record.scope_match,
  scope_candidate:annotated.service_scope_candidate,scope_match:annotated.service_scope_match};
});}
