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
  <article className="pathCertificateCard">
   <div className="pathCertificateLeft"><div className="pathCertificateTitle">PROVENRA <span>CERTIFICATE</span></div><div className="pathCertificatePathTitle">{cert.title}</div>
    <div className="pathCertificateIntro">This is to certify that</div><div className="pathCertificateName">{cert.name}</div>
    <div className="pathCertificateBody"><b>has successfully completed the {totalHours} hour learning path</b><strong>{cert.title}</strong><p>{cert.description||'A structured learning path completed through dedication, consistency, and successful completion of all required courses.'}</p></div>
    <div className="pathCertificateMeta"><div><span>Date of issue:</span><b>{date}</b></div><div className="pathCertificateSignature"><em>M. Swedan</em><i></i><span>MARWAN SWEDAN</span></div></div>
   </div>
   <div className="pathCertificateArt"><div className="pathCertificateBrandMark" aria-hidden="true"><svg viewBox="0 0 120 140"><path d="M60 5 108 23v38c0 33-19 57-48 73C31 118 12 94 12 61V23L60 5Z" fill="#0a1016" stroke="#d2b477" strokeWidth="3"/><g fill="none" stroke="#e0c98f" strokeWidth="3.2" strokeLinecap="round"><path d="M35 61c0-16 11-28 25-28s25 12 25 28"/><path d="M42 65c0-12 7-20 18-20s18 8 18 20c0 16-5 28-14 39"/><path d="M49 65c0-7 4-12 11-12s11 5 11 12c0 18-3 28-10 38"/><path d="M57 65c0-3 1-5 3-5s3 2 3 5c0 16-1 25-5 33"/><path d="M29 69c0 19 5 34 15 45"/><path d="M91 69c0 13-3 25-9 34"/></g></svg><b>PROVENRA</b><span>CYBERSECURITY · DIGITAL FORENSICS</span></div><div className="hex hex1"/><div className="hex hex2"/><div className="hex hex3"/><div className="hex hex4"/><div className="hex hex5"/><div className="hex hex6"/><div className="hexGrid"/></div>
  </article>
  <div className="certificateActionsBar"><CertificateActions shareUrl={shareUrl}/></div>
 </section></div></main>;
}
