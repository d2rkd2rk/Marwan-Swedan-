export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import SiteNav from '@/app/components/SiteNav';
import CertificateActions from '@/app/components/CertificateActions';

export async function generateMetadata({params}:{params:Promise<{certificateId:string}>}){
  const {certificateId}=await params;
  const rows=await db`select u.name,c.title from course_certificates cc join users u on u.id=cc.user_id join courses c on c.id=cc.course_id where cc.certificate_id=${certificateId} and c.published=true limit 1`;
  if(!rows.length)return {title:'Certificate | Marwan Swedan Academy'};
  const cert=rows[0] as any;
  return {title:`Certificate — ${cert.name} | Marwan Swedan Academy`,description:`Verified certificate of completion for ${cert.title}, issued by Marwan Swedan Academy.`};
}

export default async function CertificatePage({params}:{params:Promise<{certificateId:string}>}){
  const {certificateId}=await params;
  const rows=await db`select cc.certificate_id,cc.issued_at,u.name,c.title,c.slug
    from course_certificates cc
    join users u on u.id=cc.user_id
    join courses c on c.id=cc.course_id
    where cc.certificate_id=${certificateId} and c.published=true
    limit 1`;
  if(!rows.length)return <main><div className="shell"><SiteNav/><section className="section"><div className="form"><h1>Certificate not found.</h1><p className="muted">This certificate ID is invalid or no longer available.</p><Link className="btn primary" href="/courses">Back to academy</Link></div></section></div></main>;
  const cert=rows[0] as any;
  const issued=new Date(cert.issued_at);
  const date=issued.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const shareUrl=`${process.env.NEXT_PUBLIC_SITE_URL||'https://marwan-swedan.vercel.app'}/certificate/${encodeURIComponent(cert.certificate_id)}`;
  return <main><div className="shell"><SiteNav/>
    <section className="certificateSection">
      <div className="certificateToolbar">
        <div><div className="eyebrow">Verified achievement</div><h1>Certificate of Completion</h1><p className="muted">This certificate confirms that the student completed 100% of the course requirements.</p></div>
        <CertificateActions shareUrl={shareUrl}/>
      </div>
      <article className="certificateCard">
        <div className="certificateTop"><span className="certificateBrand">MARWAN SWEDAN</span><span className="certificateId">CERTIFICATE ID<br/><b>{cert.certificate_id}</b></span></div>
        <div className="certificateMedal" aria-hidden="true">✓</div>
        <div className="certificateTitle">CERTIFICATE</div>
        <div className="certificateSubtitle"><i/> OF COMPLETION <i/></div>
        <div className="certificatePresented">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
        <div className="certificateName">{cert.name}</div>
        <div className="certificateLine"/>
        <div className="certificateFor">FOR SUCCESSFULLY COMPLETING THE COURSE</div>
        <div className="certificateCourse">{cert.title}</div>
        <p className="certificateText">This certificate recognizes the successful completion of every required lesson in this course.</p>
        <div className="certificateMeta"><div><span>COMPLETED ON</span><b>{date}</b></div><div><span>VERIFICATION</span><b>Verified Certificate</b></div></div>
        <div className="certificateBottom"><div><small>COURSE COMPLETION</small><small>VERIFIED ACHIEVEMENT</small></div><div className="certificateSignature"><em>Marwan Swedan</em><span>MARWAN SWEDAN · INSTRUCTOR</span></div><div className="certificateVerify"><strong>VERIFY THIS CERTIFICATE</strong><span>{shareUrl}</span></div></div>
      </article>
      <div className="certificateShareNote"><b>Share your achievement.</b><span>Public verification link:</span><a href={shareUrl} target="_blank" rel="noreferrer">{shareUrl}</a></div>
    </section>
  </div></main>;
}
