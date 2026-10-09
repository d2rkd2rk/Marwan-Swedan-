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
  default:'Marwan Swedan | Cybersecurity & Digital Forensics',
  template:'%s | Marwan Swedan',
 },
 description:'Marwan Swedan is a cybersecurity analyst focused on SOC operations, digital forensics, incident response, networking, and practical technology education through Marwan Swedan Academy.',
 applicationName:'Marwan Swedan Academy',
 authors:[{name:'Marwan Swedan',url:siteUrl}],
 creator:'Marwan Swedan',
 publisher:'Marwan Swedan Academy',
 manifest:'/manifest.json',
 themeColor:'#06111a',
 icons:{icon:'/images/marwan-app-icon.svg',apple:'/images/marwan-app-icon.svg'},
 openGraph:{
  type:'website',
  siteName:'Marwan Swedan Academy',
  title:'Marwan Swedan | Cybersecurity & Digital Forensics',
  description:'Cybersecurity, digital forensics, SOC operations, and practical technology education by Marwan Swedan in Egypt.',
  url:siteUrl,
  locale:'en_US',
  images:[{url:'/images/profile.jpg',alt:'Marwan Swedan'}],
 },
 twitter:{
  card:'summary_large_image',
  title:'Marwan Swedan | Cybersecurity & Digital Forensics',
  description:'Cybersecurity, digital forensics, SOC operations, and practical technology education by Marwan Swedan.',
  images:[{url:'/images/profile.jpg',alt:'Marwan Swedan'}],
 },
};

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body><GlobalMotion/><CourseImageManager/><AdminEnhancements/><PWAInstallPrompt/>{children}</body></html>
}
