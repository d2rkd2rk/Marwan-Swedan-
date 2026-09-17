import './globals.css';
import './mobile.css';
import './premium.css';
import type {Metadata} from 'next';
import GlobalMotion from './components/GlobalMotion';
export const metadata:Metadata={title:'Marwan Swedan | Cybersecurity & Digital Forensics',description:'Cybersecurity portfolio and private academy by Marwan Swedan'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><GlobalMotion/>{children}</body></html>}
