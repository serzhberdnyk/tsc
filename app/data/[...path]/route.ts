import {env} from 'cloudflare:workers';
import {evidenceKey} from '../../../lib/tenders/api.js';
export const dynamic='force-dynamic';
export async function GET(request:Request){const key=decodeURIComponent(new URL(request.url).pathname.slice(1));if(!evidenceKey(key))return new Response('Not found',{status:404});const value=await env.BUCKET?.get(key);if(!value)return new Response('Not found',{status:404});return new Response(value.body,{headers:{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cache-Control':'no-store'}});}
