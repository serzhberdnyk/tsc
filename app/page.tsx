import Script from 'next/script';
import html from '../lib/tenders/page-html';
export default function Home(){return <><div dangerouslySetInnerHTML={{__html:html}}/><Script src="/tenders.js" strategy="afterInteractive"/></>;}
