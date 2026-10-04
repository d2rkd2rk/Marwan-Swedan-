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
   <div className="pathCertificateLeft"><div className="pathCertificateTitle">CERTIFICATE <span>IN</span></div><div className="pathCertificatePathTitle">{cert.title}</div>
    <div className="pathCertificateIntro">This is to certify that</div><div className="pathCertificateName">{cert.name}</div>
    <div className="pathCertificateBody"><b>has successfully completed the {totalHours} hour learning path</b><strong>{cert.title}</strong><p>{cert.description||'A structured learning path completed through dedication, consistency, and successful completion of all required courses.'}</p></div>
    <div className="pathCertificateMeta"><div><span>Date of issue:</span><b>{date}</b></div><div className="pathCertificateSignature"><em>M. Swedan</em><i></i><span>MARWAN SWEDAN</span></div></div>
   </div>
   <div className="pathCertificateArt" aria-hidden="true"><div className="hex hex1"/><div className="hex hex2"/><div className="hex hex3"/><div className="hex hex4"/><div className="hex hex5"/><div className="hex hex6"/><div className="hexGrid"/></div>
  </article>
  <div className="certificateActionsBar"><CertificateActions shareUrl={shareUrl}/></div>
 </section></div></main>;
}
