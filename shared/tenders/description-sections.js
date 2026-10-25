// Presentation only. No positions, quantities, status or commercial facts are inferred.
// All returned strings remain untrusted plain text: render with textContent/escaping.
const tidy=value=>String(value??'').replace(/[\t\f\v ]+/g,' ').trim();
function plain(html){return tidy(String(html??'').replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&#x([\da-f]+);/gi,(_,n)=>codepoint(n,16)).replace(/&#(\d+);/g,(_,n)=>codepoint(n,10)).replace(/&nbsp;/gi,' ').replace(/&quot;/gi,'"').replace(/&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&amp;/gi,'&'));}
function codepoint(value,base){const n=parseInt(value,base);return Number.isInteger(n)&&n>=0&&n<=0x10ffff?String.fromCodePoint(n):'�';}
const labels=['Предмет закупки','Критерии выбора победителя','Сроки и этапы закупки','Фиксация цены на срок действия контракта','Условия оплаты','Адрес, условия и сроки исполнения','Требования к технической документации','Готовность рассмотреть аналоги','График проведения тендера','Требуемые условия оплаты','Плановая дата монтажа'];
const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const labelBoundary=new RegExp('(?=(?:'+labels.map(escaped).join('|')+')\\s*:|Этап\\s+\\d+\\s*[-–—])','gu');
const abbreviations=new Set(['г','ул','пр','пер','д','стр','корп','эл','кв','мес','руб','шт','тел','т','п','др','им']);
function sentences(text){const result=[];let from=0;for(const match of text.matchAll(/[.!?](?=\s+[А-ЯЁA-Z])/gu)){const end=match.index+1,word=text.slice(from,end).match(/([А-ЯЁа-яёA-Za-z]+)\.$/)?.[1]?.toLowerCase();if(match[0]==='.'&&word&&abbreviations.has(word))continue;result.push(text.slice(from,end).trim());from=end;}result.push(text.slice(from).trim());return result.filter(Boolean);}
function paragraph(text,provenance){
 const value=tidy(text.replace(/\s+/g,' '));if(!value)return null;
 const colon=value.indexOf(':'),candidate=colon>=0?value.slice(0,colon).trim():'';
 // HTML paragraphs preserve an actual source label; plain fallback recognizes
 // only literal known source headings, never an invented business section.
 const labelled=candidate&&candidate.length<=120&&!/^(?:https?|ftp)$/i.test(candidate)&&(provenance==='source_html_paragraph'||labels.includes(candidate));
 return {kind:/^(?:[-•]\s|\d+[.)]\s)/.test(value)?'list_item':labelled?'label':'paragraph',text:value,label:labelled?candidate:null,value:labelled?value.slice(colon+1).trim():value,provenance};
}
export function descriptionSections(input,{format='plain'}={}){
 if(format!=='plain'&&format!=='html')throw Error('unsupported_description_format');
 const source=String(input??'');if(!source.trim())return [];
 if(format==='html'){
  const safe=source.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' '),paragraphs=[...safe.matchAll(/<(p|li|h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  const fragments=paragraphs.length?paragraphs.map(m=>({html:m[2],list:m[1].toLowerCase()==='li'})):[{html:safe,list:false}];
  return fragments.flatMap(fragment=>fragment.html.split(/<br\s*\/?\s*>/gi).map(value=>{const item=paragraph(plain(value),'source_html_paragraph');return item&&fragment.list?{...item,kind:'list_item'}:item;})).filter(Boolean);
 }
 // A flat fallback has no verified paragraph boundaries: preserve sentences
 // together and split only existing newlines or literal known source headings.
 return source.replace(/\r\n?/g,'\n').split(/\n+/).flatMap(line=>line.split(labelBoundary)).map(fragment=>paragraph(fragment,'normalized_plaintext_boundary')).filter(Boolean);
}
export const splitDescription=descriptionSections;
