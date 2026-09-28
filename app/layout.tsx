import './globals.css';
import './mobile.css';
import './premium.css';
import type {Metadata} from 'next';
import GlobalMotion from './components/GlobalMotion';
import CourseImageManager from './components/CourseImageManager';
import AdminEnhancements from './components/AdminEnhancements';
export const metadata:Metadata={title:'Marwan Swedan',description:'Cybersecurity portfolio and private academy by Marwan Swedan',icons:{icon:'/images/profile.jpg',shortcut:'/images/profile.jpg',apple:'/images/profile.jpg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><GlobalMotion/><CourseImageManager/><AdminEnhancements/>{children}</body></html>}