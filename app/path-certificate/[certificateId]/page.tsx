export const dynamic='force-dynamic';
import Link from 'next/link';
import db from '@/lib/db';
import SiteNav from '@/app/components/SiteNav';
import CertificateActions from '@/app/components/CertificateActions';
import ProvenraCertificate from '@/app/components/ProvenraCertificate';
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
  <ProvenraCertificate name={cert.name} title={cert.title} date={date} kind="path"/>
  <div className="certificateActionsBar"><CertificateActions shareUrl={shareUrl}/></div>
 </section></div></main>;
}
