import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Marwan Swedan | Cybersecurity & Digital Forensics',description:'Cybersecurity portfolio and private academy by Marwan Swedan'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}