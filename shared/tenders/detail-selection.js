/** Relevant retained cards remain a priority; independent portal cards are rotated
 * so an incomplete title classifier cannot prevent detail extraction forever. */
export function selectDetailCandidates({listed=[],retained=[],source,limit=8}={}){
 const isCandidate=r=>r.scope_candidate||(r.service_ids?.length>0&&r.performance_place?.region_match!=='outside');
 const prior=new Map(retained.filter(r=>r.source_id===source.id).map(r=>[r.id,r]));
 const candidates=new Map(listed.map(r=>[r.id,r]));
 for(const r of prior.values())if(isCandidate(r)&&!candidates.has(r.id))candidates.set(r.id,r);
 const sameOrigin=r=>{try{return new URL(r.direct_url).origin===new URL(source.url).origin;}catch{return false;}};
 const priority=r=>r.performance_place?.region_match==='confirmed'&&(isCandidate(r)||r.discovery_detail_candidate)?0:isCandidate(r)?2:3;
 const checked=r=>{const p=prior.get(r.id);return p?.verification==='detail_verified'?Date.parse(p.checked_at)||0:0;};
 // A recent sample should not starve never-checked pages on later cycles.
 return [...candidates.values()].filter(sameOrigin).sort((a,b)=>{
  return priority(a)-priority(b)||checked(a)-checked(b)||Number(!!source.detail_sample_numbers?.includes(b.number))-Number(!!source.detail_sample_numbers?.includes(a.number))||String(b.source_published_at||b.source_published_raw||'').localeCompare(String(a.source_published_at||a.source_published_raw||''))||a.id.localeCompare(b.id);
 }).slice(0,limit);
}
