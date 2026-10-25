import type { Metadata } from 'next';
import './globals.css';
import themeScript from '../lib/tenders/theme-script';
export const metadata:Metadata={title:'TSC · Tender Search Company',description:'Tender Search Company — поиск закупок в Сочи и Краснодарском крае.',icons:{icon:[{url:'/favicon.svg?v=tsc-globe-1',type:'image/svg+xml'},{url:'/favicon-16.png',sizes:'16x16',type:'image/png'},{url:'/favicon-32.png',sizes:'32x32',type:'image/png'},{url:'/favicon.ico?v=tsc-globe-1',sizes:'any'}],apple:'/apple-touch-icon.png?v=tsc-globe-1'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>;}
