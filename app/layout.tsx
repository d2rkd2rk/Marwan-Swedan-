import './globals.css';
import './mobile.css';
import './premium.css';
import type {Metadata} from 'next';
import GlobalMotion from './components/GlobalMotion';
import CourseImageManager from './components/CourseImageManager';
import AdminEnhancements from './components/AdminEnhancements';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const siteUrl = 'https://marwanswedan.online';

export const metadata:Metadata={
 metadataBase:new URL(siteUrl),
 title:{
  default:'PROVENRA | Cybersecurity & Digital Forensics Academy',
  template:'%s | PROVENRA',
 },
 description:'PROVENRA is a cybersecurity education platform founded by Marwan Swedan, offering practical learning in cybersecurity, digital forensics, SOC operations, incident response, and threat intelligence.',
 applicationName:'PROVENRA',
 authors:[{name:'Marwan Swedan',url:siteUrl}],
 creator:'PROVENRA',
 publisher:'PROVENRA',
 keywords:[
  'PROVENRA','PROVENRA Academy','Cybersecurity Academy','Cybersecurity Courses',
  'Digital Forensics','SOC Analyst','Incident Response','Threat Intelligence',
  'Security Operations Center','Marwan Swedan','مروان سويدان','Marwan Swaidan','مروان سويدان PROVENRA','Marwan Swedan Cybersecurity'
 ],
 robots:{
  index:true,
  follow:true,
  googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1},
 },
 manifest:'/manifest.json',
 themeColor:'#0a1016',
 appleWebApp:{
  capable:true,
  statusBarStyle:'black-translucent',
  title:'PROVENRA',
 },
 icons:{
  icon:'/images/provenra-app-icon-v2.svg',
  shortcut:'/images/provenra-app-icon-v2.svg',
  apple:{url:'/images/provenra-app-icon-v2.svg',sizes:'512x512',type:'image/svg+xml'},
 },
 openGraph:{
  type:'website',
  siteName:'PROVENRA',
  title:'PROVENRA | Cybersecurity & Digital Forensics Academy',
  description:'Learn cybersecurity, digital forensics, SOC operations, incident response, and threat intelligence through practical education.',
  url:siteUrl,
  locale:'en_US',
  images:[{url:'/images/profile.jpg',alt:'PROVENRA — Cybersecurity & Digital Forensics Academy'}],
 },
 twitter:{
  card:'summary_large_image',
  title:'PROVENRA | Cybersecurity & Digital Forensics Academy',
  description:'Practical cybersecurity and digital forensics education by PROVENRA.',
  images:[{url:'/images/profile.jpg',alt:'PROVENRA — Cybersecurity & Digital Forensics Academy'}],
 },
};

const structuredData=[
 {
  '@context':'https://schema.org',
  '@type':'Organization',
  name:'PROVENRA',
  alternateName:'PROVENRA Cybersecurity Academy',
  url:siteUrl,
  description:'A cybersecurity education platform focused on cybersecurity, digital forensics, SOC operations, incident response, and threat intelligence.',
  founder:{'@id':siteUrl+'/#person'},
 },
 {
  '@context':'https://schema.org',
  '@type':'Person',
  '@id':siteUrl+'/#person',
  name:'Marwan Swedan',
  alternateName:['مروان سويدان','Marwan Swaidan'],
  url:siteUrl,
  image:siteUrl+'/images/profile.jpg',
  jobTitle:'Cybersecurity Analyst and Digital Forensics Practitioner',
  description:'Marwan Swedan (مروان سويدان) is an Egyptian cybersecurity learner and practitioner focused on digital forensics, SOC operations, incident response, and cybersecurity education. Founder of PROVENRA.',
  worksFor:{'@type':'Organization','name':'PROVENRA','url':siteUrl},
  sameAs:[
   'https://eg.linkedin.com/in/marwan-swedan',
   'https://www.facebook.com/share/19efBQt717/',
   'https://www.instagram.com/marwan_swedan_/',
   'https://www.tiktok.com/@marwan_swedan',
  ],
  knowsAbout:['Cybersecurity','Digital Forensics','Security Operations Center','Incident Response','Threat Intelligence','Cybersecurity Education'],
 },
 {
  '@context':'https://schema.org',
  '@type':'WebSite',
  name:'PROVENRA',
  alternateName:'PROVENRA Academy',
  url:siteUrl,
  description:'Cybersecurity and digital forensics education.',
 },
];

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/><GlobalMotion/><CourseImageManager/><AdminEnhancements/><PWAInstallPrompt/>{children}</body></html>
}
