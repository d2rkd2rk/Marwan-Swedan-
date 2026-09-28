import './globals.css';
import './mobile.css';
import './premium.css';
import type {Metadata} from 'next';
import GlobalMotion from './components/GlobalMotion';
import CourseImageManager from './components/CourseImageManager';
import AdminEnhancements from './components/AdminEnhancements';
export const metadata:Metadata={title:'Marwan Swedan',description:'Cybersecurity portfolio and private academy by Marwan Swedan'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><GlobalMotion/><CourseImageManager/><AdminEnhancements/>{children}</body></html>}