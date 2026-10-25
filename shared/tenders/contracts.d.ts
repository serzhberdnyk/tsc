/** Schema 1.0 describes one source publication, not an automatically merged procurement. */
export interface Publication {
 id:string; source_id:string; source_record_id:string; number:string;
 buyer:{name:string;source_id:string|null}; subject:string; description:string|null;
 performance_place:{addresses:Record<string,string|null>[];text:string|null;basis:string;region_match:'confirmed'|'unknown'|'outside';needs_exact_address:boolean};
 budget:{amount:number|null;currency:string|null;raw:unknown};
 deadline:{raw:string|null;utc:string|null;timezone:string|null;error:string|null};
 source_status:{code:unknown;label:string|null;normalized:'open'|'evaluation'|'completed'|'cancelled'|'unknown'};
 direct_url:string;checked_at:string;observed_at:string;parser_version:string;
 verification:'list_only'|'detail_verified'|'needs_recheck'|'unverified';
 documents:Record<string,unknown>[];contacts:{purpose:string;public_data:unknown}[];evidence:string[];
 procurement_refs?:{authority:string;notice_number:string;regime:string;lot_number:string|null;evidence:string[]}[];
 procurement_kind?:'selection_procurement'|'request_for_price';
 alert_state?:'HOLD';source_listing_url?:string;
 [key:string]:unknown;
}
export interface ParseContext{checkedAt:string;evidence:string;url?:string;source?:string;}
export interface PageResponse{body:string;meta:{checked_at:string;[key:string]:unknown};evidence:string;}
export interface BoundedPublicClient{get(url:string):Promise<PageResponse>;stopped:boolean;}
export interface Adapter{
 id:string;family_id:string;contract_version:string;parser_version:string;allowed_origins:readonly string[];
 capabilities:Readonly<{list:boolean;detail:boolean;filtered:boolean}>;
 max_list_pages?:number;
 normalize(item:unknown,context:ParseContext):Publication;
 parseList(html:string,context:ParseContext):Publication[];
 parseDetail(html:string,listed:Publication,context:ParseContext):Publication;
 collectFiltered?:(client:BoundedPublicClient)=>Promise<{records:Publication[];report:Record<string,unknown>}>;
}
export interface SourceAssessment{
 availability:{state:string;reason_code:string;checked_at:string|null;evidence:string[];stopped:boolean};
 verification:{state:string;adapter:'implemented'|'not_implemented';checked_at:string|null;fresh:boolean;runtime:'local'|'cloud'|null;independent:boolean;historical_only:boolean};
 coverage:{state:string;complete_source:boolean;filters:Record<string,unknown>[];retained_records:number};
}
