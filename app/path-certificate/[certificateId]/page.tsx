export const dynamic='force-dynamic';
import Link from 'next/link';
import db from '@/lib/db';
import SiteNav from '@/app/components/SiteNav';
import CertificateActions from '@/app/components/CertificateActions';
import {ensurePathTables} from '@/lib/pathAccess';

export default async function PathCertificatePage({params}:{params:Promise<{certificateId:string}>}){
 const {certificateId}=await params; await ensurePathTables();
 const rows=await db`select pc.certificate_id,pc.issued_at,u.name,p.title,p.description
   from path_certificates pc join users u on u.id=pc.user_id join paths p on p.id=pc.path_id
   where pc.certificate_id=${certificateId} limit 1`;
 if(!rows.length)return <main><div className="shell"><SiteNav/><section className="section"><div className="form"><h1>Certificate not found.</h1><p className="muted">This certificate ID is invalid or no longer available.</p><Link className="btn primary" href="/paths">Back to paths</Link></div></section></div></main>;
 const cert=rows[0] as any; const date=new Date(cert.issued_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
 const shareUrl=`${process.env.NEXT_PUBLIC_SITE_URL||'https://marwan-swedan.vercel.app'}/path-certificate/${encodeURIComponent(cert.certificate_id)}`;
 const hours=await db`select coalesce(sum(c.duration_minutes),0)::int as minutes from path_courses pc join courses c on c.id=pc.course_id where pc.path_id=(select path_id from path_certificates where certificate_id=${certificateId} limit 1)`;
 const totalHours=Math.round(Number(hours[0]?.minutes||0)/60*10)/10;
 return <main><div className="shell"><SiteNav/><section className="pathCertificateSection">
  <article className="provenraCertificate">
 <div className="pcFrame"/>
 <div className="pcCorner pcCornerTL"/><div className="pcCorner pcCornerTR"/><div className="pcCorner pcCornerBL"/><div className="pcCorner pcCornerBR"/>
 <div className="pcRibbon pcRibbonLeft"/><div className="pcRibbon pcRibbonRight"/>
 <div className="pcContent">
  <header className="pcBrand"><svg viewBox="0 0 80 94" aria-hidden="true"><path d="M40 3 74 16v29c0 22-13 37-34 46C19 82 6 67 6 45V16L40 3Z" fill="#071326" stroke="#d4af5b" strokeWidth="3.5"/><path d="M24 62V29h19c12 0 17 6 17 15 0 7-4 12-11 14l12 12H48L35 56h-1v6Zm10-15h8c5 0 8-2 8-6s-3-6-8-6h-8Z" fill="none" stroke="#e7c777" strokeWidth="3.2" strokeLinejoin="round"/><path d="M31 68V43h10c8 0 12 4 12 11 0 7-4 11-12 11" fill="none" stroke="#d4af5b" strokeWidth="2.4"/></svg><span>PROVENRA</span></header>
  <div className="pcHeading">Certificate of Completion</div>
  <div className="pcIntro">This is to certify that</div>
  <div className="pcRecipient">{cert.name}</div>
  <div className="pcRule"/>
  <div className="pcCompletion">has successfully completed the learning path</div>
  <div className="pcCourseTitle">{cert.title}</div>
  <footer className="pcFooter">
   <div className="pcAcademy"><b>PROVENRA</b><span>Academy</span><small>{date}</small></div>
   <div className="pcMedal"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="pcMedalGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0ad"/><stop offset=".48" stopColor="#d4a83f"/><stop offset="1" stopColor="#8c5a17"/></linearGradient></defs><path d="M60 3 69 9 80 7 87 16 98 19 101 30 111 38 108 49 116 60 108 71 111 82 101 90 98 101 87 104 80 113 69 111 60 118 51 111 40 113 33 104 22 101 19 90 9 82 12 71 4 60 12 49 9 38 19 30 22 19 33 16 40 7 51 9Z" fill="url(#pcMedalGold)" stroke="#f5d98b" strokeWidth="2"/><circle cx="60" cy="60" r="38" fill="#8b5d1e" stroke="#f6d889" strokeWidth="3"/><circle cx="60" cy="60" r="31" fill="none" stroke="#eac66c" strokeWidth="1.5"/><path d="M60 34 67 49 83 51 71 62 74 78 60 70 46 78 49 62 37 51 53 49Z" fill="none" stroke="#f7df9b" strokeWidth="3" strokeLinejoin="round"/><path d="M60 45v30M45 60h30" stroke="#f7df9b" strokeWidth="2"/></svg></div>
   <div className="pcAuthorized"><b>M. Swedan</b><span>Authorized</span><small>Signature</small></div>
  </footer>
 </div>
</article>
  <div className="certificateActionsBar"><CertificateActions shareUrl={shareUrl}/></div>
 </section></div></main>;
}
