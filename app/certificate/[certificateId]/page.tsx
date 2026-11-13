export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import SiteNav from '@/app/components/SiteNav';
import CertificateActions from '@/app/components/CertificateActions';

async function ensureCertificateFlag(){
  await db`alter table courses add column if not exists certificate_enabled boolean not null default false`;
}

export async function generateMetadata({params}:{params:Promise<{certificateId:string}>}){
  const {certificateId}=await params;
  await ensureCertificateFlag();
  const rows=await db`select u.name,c.title from course_certificates cc join users u on u.id=cc.user_id join courses c on c.id=cc.course_id where cc.certificate_id=${certificateId} and c.published=true and c.certificate_enabled=true limit 1`;
  if(!rows.length)return {title:'Certificate | PROVENRA'};
  const cert=rows[0] as any;
  return {
    title:`Certificate — ${cert.name} | PROVENRA`,
    description:`Verified certificate of completion for ${cert.title}.`
  };
}

function ProvenraFingerprintMark({className=''}:{className?:string}){
  return <svg className={className} viewBox="0 0 120 140" role="img" aria-label="PROVENRA fingerprint shield">
    <defs><linearGradient id="provenraGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f0dfb4"/><stop offset="1" stopColor="#b18d51"/></linearGradient></defs>
    <path d="M60 5 108 23v38c0 33-19 57-48 73C31 118 12 94 12 61V23L60 5Z" fill="#0a1016" stroke="url(#provenraGold)" strokeWidth="3"/>
    <g fill="none" stroke="url(#provenraGold)" strokeWidth="3.2" strokeLinecap="round">
      <path d="M35 61c0-16 11-28 25-28s25 12 25 28"/>
      <path d="M42 65c0-12 7-20 18-20s18 8 18 20c0 16-5 28-14 39"/>
      <path d="M49 65c0-7 4-12 11-12s11 5 11 12c0 18-3 28-10 38"/>
      <path d="M57 65c0-3 1-5 3-5s3 2 3 5c0 16-1 25-5 33"/>
      <path d="M29 69c0 19 5 34 15 45"/>
      <path d="M91 69c0 13-3 25-9 34"/>
    </g>
  </svg>;
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

  if(mark==='PY'){
    return <div className="certificateEmblem certificatePythonEmblem" aria-label={`${title} course emblem`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 13c-19 0-24 9-24 23v10h27v6H16c-14 0-17 10-17 20 0 10 4 15 14 15h10V73c0-14 9-23 24-23h24c10 0 17-6 17-17V35c0-14-8-22-38-22Zm-14 13a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"/>
        <path d="M50 87c19 0 24-9 24-23V54H47v-6h37c14 0 17-10 17-20 0-10-4-15-14-15H77v14c0 14-9 23-24 23H29c-10 0-17 6-17 17v-2c0 14 8 22 38 22Zm14-13a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>
      </svg>
    </div>;
  }

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

  if(!rows.length)return <main><div className="shell"><SiteNav/><section className="section"><div className="form"><h1>Certificate not found.</h1><p className="muted">This certificate ID is invalid or no longer available.</p><Link className="btn primary" href="/courses">Back to courses</Link></div></section></div></main>;

  const cert=rows[0] as any;
  const issued=new Date(cert.issued_at);
  const date=issued.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const shareUrl=`${process.env.NEXT_PUBLIC_SITE_URL||'https://marwan-swedan.vercel.app'}/certificate/${encodeURIComponent(cert.certificate_id)}`;

  return <main>
    <div className="shell">
      <SiteNav/>
      <section className="certificateSection">
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
  <div className="pcCompletion">has successfully completed the course</div>
  <div className="pcCourseTitle">{cert.title}</div>
  <footer className="pcFooter">
   <div className="pcAcademy"><b>PROVENRA</b><span>Academy</span><small>{date}</small></div>
   <div className="pcMedal"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="pcMedalGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0ad"/><stop offset=".48" stopColor="#d4a83f"/><stop offset="1" stopColor="#8c5a17"/></linearGradient></defs><path d="M60 3 69 9 80 7 87 16 98 19 101 30 111 38 108 49 116 60 108 71 111 82 101 90 98 101 87 104 80 113 69 111 60 118 51 111 40 113 33 104 22 101 19 90 9 82 12 71 4 60 12 49 9 38 19 30 22 19 33 16 40 7 51 9Z" fill="url(#pcMedalGold)" stroke="#f5d98b" strokeWidth="2"/><circle cx="60" cy="60" r="38" fill="#8b5d1e" stroke="#f6d889" strokeWidth="3"/><circle cx="60" cy="60" r="31" fill="none" stroke="#eac66c" strokeWidth="1.5"/><path d="M60 34 67 49 83 51 71 62 74 78 60 70 46 78 49 62 37 51 53 49Z" fill="none" stroke="#f7df9b" strokeWidth="3" strokeLinejoin="round"/><path d="M60 45v30M45 60h30" stroke="#f7df9b" strokeWidth="2"/></svg></div>
   <div className="pcAuthorized"><b>M. Swedan</b><span>Authorized</span><small>Signature</small></div>
  </footer>
 </div>
</article>

        <div className="certificateActionsBar">
          <CertificateActions shareUrl={shareUrl}/>
        </div>
      </section>
    </div>
  </main>;
}
