import {PublicSourceClient} from '../../shared/tenders/public-client.js';
import {getAdapter} from '../../shared/tenders/adapters.js';
export {hash,sourceStopped} from '../../shared/tenders/public-client.js';
export class CloudPublicClient extends PublicSourceClient{
 constructor({bucket,runId,source,fetchImpl=fetch,budgetMs=25000}){
  const adapter=getAdapter(source.adapter||source.id);if(!adapter.allowed_origins.includes(new URL(source.url).origin))throw Error('cloud_adapter_not_enabled');
  super({source,runId,fetchImpl,budgetMs,runtime:'cloudflare_worker',writeEvidence:(key,body)=>bucket.put(key,body,{httpMetadata:{contentType:'text/plain; charset=utf-8'}})});
 }
}
