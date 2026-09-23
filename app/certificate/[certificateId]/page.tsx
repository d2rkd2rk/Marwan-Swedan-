export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import SiteNav from '@/app/components/SiteNav';
import CertificateActions from '@/app/components/CertificateActions';

async function ensureCertificateFlag(){await db`alter table courses add column if not exists certificate_enabled boolean not null default false`}

export async function generateMetadata({params}:{params:Promise<{certificateId:string}>}){
  const {certificateId}=await params;
  await ensureCertificateFlag();
  const rows=await db`select u.name,c.title from course_certificates cc join users u on u.id=cc.user_id join courses c on c.id=cc.course_id where cc.certificate_id=${certificateId} and c.published=true and c.certificate_enabled=true limit 1`;
  if(!rows.length)return {title:'Certificate | Marwan Swedan'};
  const cert=rows[0] as any;
  return {title:`Certificate — ${cert.name} | Marwan Swedan`,description:`Verified certificate of completion for ${cert.title}.`};
}

function CourseEmblem({title}:{title:string}){
  const t=title.toLowerCase();
  let mark='COURSE';
  if(t.includes('python')) mark='PY';
  else if(t.includes('c++')) mark='C++';
  else if(t.includes('network')) mark='NET';
  else if(t.includes('javascript')) mark='JS';
  else if(t.includes('java')) mark='JAVA';
  else if(t.includes('linux')) mark='LINUX';
  else if(t.includes('cyber')||t.includes('security')) mark='SEC';
  else mark=title.trim().split(/\\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase().slice(0,4)||'COURSE';
  return <div className="certificateEmblem" aria-label={`${title} course emblem`}><span>{mark}</span></div>;
}

export default async function CertificatePage({params}:{params:Promise<{certificateId:string}>}){
  const {certificateId}=await params;
  await ensureCertificateFlag();
  const rows=await db`select cc.certificate_id,cc.issued_at,u.name,c.title,c.slug
    from course_certificates cc
    join users u on u.id=cc.user_id
    join courses c on c.id=cc.course_id
    where cc.certificate_id=${certificateId} and c.published=true and c.certificate_enabled=true
    limit 1`;
  if(!rows.length)return <main><div className="shell"><SiteNav/><section className="section"><div className="form"><h1>Certificate not found.</h1><p className="muted">This certificate ID is invalid or no longer available.</p><Link className="btn primary" href="/courses">Back to academy</Link></div></section></div></main>;
  const cert=rows[0] as any;
  const issued=new Date(cert.issued_at);
  const date=issued.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const shareUrl=`${process.env.NEXT_PUBLIC_SITE_URL||'https://marwan-swedan.vercel.app'}/certificate/${encodeURIComponent(cert.certificate_id)}`;
  return <main><div className="shell"><SiteNav/>
    <section className="certificateSection">
      <div className="certificateToolbar">
        <div><div className="eyebrow">Verified certificate</div><h1>Certificate of Completion</h1></div>
        <CertificateActions shareUrl={shareUrl}/>
      </div>
      <article className="certificateCard">
        <div className="certificateCorner certificateCornerTL" aria-hidden="true"/>
        <div className="certificateCorner certificateCornerBR" aria-hidden="true"/>
        <div className="certificateTop"><span className="certificateBrand">MARWAN SWEDAN</span><span className="certificateId">CERTIFICATE ID · <b>{cert.certificate_id}</b></span></div>
        <div className="certificateMain">
          <div className="certificateHeading">CERTIFICATE OF COMPLETION</div>
          <div className="certificateRule"/>
          <div className="certificatePresented">THIS CERTIFICATE IS PRESENTED TO</div>
          <div className="certificateName">{cert.name}</div>
          <div className="certificateRule certificateRuleShort"/>
          <div className="certificateCourse">{cert.title}</div>
          <div className="certificateEmblemWrap"><CourseEmblem title={cert.title}/></div>
        </div>
        <div className="certificateBottom">
          <div className="certificateDate"><span>ISSUE DATE</span><b>{date}</b></div>
          <div className="certificateSignature"><em>Marwan Swedan</em><div>MARWAN SWEDAN</div></div>
          <div className="certificateVerify"><span>VERIFIED CERTIFICATE</span><b>{cert.certificate_id}</b></div>
        </div>
      </article>
      <div className="certificateShareNote"><b>Share your certificate</b><span>LinkedIn will share the public verification link to this certificate.</span><a href={shareUrl} target="_blank" rel="noreferrer">Open certificate ↗</a></div>
    </section>
  </div></main>;
}
