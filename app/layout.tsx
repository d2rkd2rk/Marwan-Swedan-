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
  default:'PROVENRA | Cybersecurity & Digital Forensics',
  template:'%s | PROVENRA',
 },
 description:'PROVENRA is a cybersecurity learning platform focused on digital forensics, threat intelligence, SOC operations, and practical security education.',
 applicationName:'PROVENRA',
 authors:[{name:'Marwan Swedan',url:siteUrl}],
 creator:'Marwan Swedan',
 publisher:'PROVENRA',
 manifest:'/manifest.json',
 themeColor:'#0a1016',
 appleWebApp:{
  capable:true,
  statusBarStyle:'black-translucent',
  title:'PROVENRA',
 },
 icons:{
  icon:'/images/marwan-app-icon.svg',
  shortcut:'/images/marwan-app-icon.svg',
  apple:{url:'/images/marwan-app-icon.svg',sizes:'512x512',type:'image/svg+xml'},
 },
 openGraph:{
  type:'website',
  siteName:'PROVENRA',
  title:'PROVENRA | Cybersecurity & Digital Forensics',
  description:'Cybersecurity, digital forensics, SOC operations, threat intelligence, and practical security education.',
  url:siteUrl,
  locale:'en_US',
  images:[{url:'/images/profile.jpg',alt:'Marwan Swedan'}],
 },
 twitter:{
  card:'summary_large_image',
  title:'Marwan Swedan | Cybersecurity & Digital Forensics',
  description:'Cybersecurity, digital forensics, SOC operations, threat intelligence, and practical security education.',
  images:[{url:'/images/profile.jpg',alt:'Marwan Swedan'}],
 },
};

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body><GlobalMotion/><CourseImageManager/><AdminEnhancements/><PWAInstallPrompt/>{children}</body></html>
}
