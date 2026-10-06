import './globals.css';
import './mobile.css';
import './premium.css';
import type {Metadata} from 'next';
import GlobalMotion from './components/GlobalMotion';
import CourseImageManager from './components/CourseImageManager';
import AdminEnhancements from './components/AdminEnhancements';
import PWAInstallPrompt from './components/PWAInstallPrompt';
export const metadata:Metadata={
 title:'Marwan Swedan Academy',
 description:'Cybersecurity portfolio and private academy by Marwan Swedan',
 manifest:'/manifest.json',
 themeColor:'#06111a',
 icons:{icon:'/images/marwan-app-icon.svg',apple:'/images/marwan-app-icon.svg'}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><GlobalMotion/><CourseImageManager/><AdminEnhancements/><PWAInstallPrompt/>{children}</body></html>}