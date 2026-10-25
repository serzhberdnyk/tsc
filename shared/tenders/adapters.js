import {nvmDocumentIndexURL,parseNvmDocumentIndex} from './nvm-documents.js';
import * as bidzaar from './bidzaar.js';
import {normalizeBidzaar} from './bidzaar-normalize.js';
import {walkPublicDiscovery} from './public-query.js';
import {assertRecord,assertRecordBatch} from './record-contract.js';
import {annotateServices} from './service-projection.js';
import {normalizeSibur,parseSiburList,normalizeNvm,parseNvmList,parseNvmDetail} from './public-html.js';
import {normalizeNutep,parseNutepList,normalizeRosmorport,parseRosmorportList} from './port-html.js';

const serviceRecord=r=>assertRecord(annotateServices(r)),serviceBatch=rs=>assertRecordBatch(rs.map(annotateServices));
export const ADAPTER_CONTRACT_VERSION='1.0';
/** Pure adapter contract. Network/storage are injected through the bounded client.
 * parseList(html, context) -> Publication[]; parseDetail(html, listed, context) -> Publication.
 * collectFiltered(client) -> {records, report}; throws or reports incomplete, never fake zero.
 * No registration or credential provisioning is part of an adapter.
 */
export function defineAdapter(spec){
 for(const key of ['id','family_id','parser_version'])if(typeof spec[key]!=='string'||!spec[key])throw Error('adapter_contract: '+key);
 for(const key of ['normalize','parseList','parseDetail'])if(typeof spec[key]!=='function')throw Error('adapter_contract: '+key);
 if(!Array.isArray(spec.allowed_origins)||!spec.allowed_origins.length||spec.allowed_origins.some(url=>new URL(url).origin!==url||!url.startsWith('https://')))throw Error('adapter_contract: origins');
 if(typeof spec.capabilities?.filtered!=='boolean'||spec.capabilities.filtered&&typeof spec.collectFiltered!=='function')throw Error('adapter_contract: filtered capability');
 return Object.freeze({...spec,contract_version:ADAPTER_CONTRACT_VERSION,allowed_origins:Object.freeze([...spec.allowed_origins]),capabilities:Object.freeze({...spec.capabilities})});
}
export const bidzaarAdapter=defineAdapter({
 id:'bidzaar',family_id:'bidzaar',parser_version:'bidzaar-ssr-v2',allowed_origins:['https://bidzaar.com'],capabilities:{list:true,detail:true,filtered:true},
 normalize:(...args)=>serviceRecord(normalizeBidzaar(...args)),
 parseList:(...args)=>serviceBatch(bidzaar.parseList(...args)),
 parseDetail:(...args)=>serviceRecord(bidzaar.parseDetail(...args)),
 collectFiltered:async (client,options)=>{const result=await walkPublicDiscovery(client,options);result.records=serviceBatch(result.records);return result;},
});
export const siburAdapter=defineAdapter({id:'sibur',family_id:'sibur_public_html',parser_version:'sibur-public-html-v2',allowed_origins:['https://www.sibur.ru'],capabilities:{list:true,detail:false,filtered:false},normalize:(...a)=>serviceRecord(normalizeSibur(...a)),parseList:(...a)=>serviceBatch(parseSiburList(...a)),parseDetail:()=>{throw Error('detail_requires_login: SAP access not attempted');}});
export const nvmAdapter=defineAdapter({id:'gk_nvm',family_id:'alfa2b',parser_version:'gk_nvm-public-html-v3',allowed_origins:['https://tender.gk-nvm.ru'],capabilities:{list:true,detail:true,filtered:false,document_index:true},normalize:(...a)=>serviceRecord(normalizeNvm(...a)),parseList:(...a)=>serviceBatch(parseNvmList(...a)),parseDetail:(...a)=>{const record=parseNvmDetail(...a);return serviceRecord({...record,document_listing_url:nvmDocumentIndexURL(a[0],record),parser_version:'gk_nvm-public-html-v3'});},parseDocumentIndex:(...a)=>serviceRecord(parseNvmDocumentIndex(...a))});
export const nutepAdapter=defineAdapter({id:'nutep',family_id:'nutep_html',parser_version:'nutep-public-html-v2',allowed_origins:['https://www.nutep.ru'],capabilities:{list:true,detail:false,filtered:false},normalize:(...a)=>serviceRecord(normalizeNutep(...a)),parseList:(...a)=>serviceBatch(parseNutepList(...a)),parseDetail:()=>{throw Error('detail_unverified: only inline listing and document links observed');}});
export const rosmorportAdapter=defineAdapter({id:'rosmorport_azov_black_sea',family_id:'rosmorport_html',parser_version:'rosmorport-public-html-v2',max_list_pages:2,capabilities:{list:true,detail:false,filtered:false},allowed_origins:['https://www.rosmorport.ru'],normalize:(...a)=>serviceRecord(normalizeRosmorport(...a)),parseList:(...a)=>serviceBatch(parseRosmorportList(...a)),parseDetail:()=>{throw Error('detail_external: EIS/ETP links not followed');}});
const implemented=new Map([bidzaarAdapter,siburAdapter,nvmAdapter,nutepAdapter,rosmorportAdapter].map(x=>[x.id,x]));
export function getAdapter(id){const adapter=implemented.get(id);if(!adapter){const error=Error('adapter_not_implemented: '+id);error.code='adapter_not_implemented';throw error;}return adapter;}
export const implementedAdapterIds=Object.freeze([...implemented.keys()]);
