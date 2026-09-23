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
  if(!rows.length)return {title:'Certificate | Marwan Swedan'};
  const cert=rows[0] as any;
  return {
    title:`Certificate — ${cert.name} | Marwan Swedan`,
    description:`Verified certificate of completion for ${cert.title}.`
  };
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
        <article className="certificateCard">
          <div className="certificateCorner certificateCornerTL" aria-hidden="true"/>
          <div className="certificateCorner certificateCornerTR" aria-hidden="true"/>
          <div className="certificateCorner certificateCornerBR" aria-hidden="true"/>
          <div className="certificateCorner certificateCornerBL" aria-hidden="true"/>

          <div className="certificateInner">
            <header className="certificateHeader">
              <div className="certificateAcademy">MARWAN SWEDAN ACADEMY</div>
              <div className="certificateTagline">LEARN <span>•</span> BUILD <span>•</span> GROW</div>
            </header>

            <div className="certificateContent">
              <div className="certificateHeading">CERTIFICATE OF COMPLETION</div>
              <div className="certificatePresented">THIS CERTIFIES THAT</div>
              <div className="certificateName">{cert.name}</div>
              <div className="certificateGoldLine"/>

              <div className="certificateCompleted">has successfully completed the course</div>
              <div className="certificateCourse">{cert.title}</div>

              <p className="certificateDescription">
                This certificate is awarded in recognition of your dedication,<br/>
                hard work and successful completion of the course.
              </p>
            </div>

            <footer className="certificateFooter">
              <div className="certificateFooterBlock certificateDateBlock">
                <div className="certificateDate">{date}</div>
                <div className="certificateFooterLine"/>
                <div className="certificateFooterLabel">ISSUE DATE</div>
              </div>

              <div className="certificateLogoBlock">
                <CourseEmblem title={cert.title}/>
              </div>

              <div className="certificateFooterBlock certificateSignatureBlock">
                <div className="certificateSignature">M. Swedan</div>
                <div className="certificateFooterLine"/>
                <div className="certificateFooterLabel">MARWAN SWEDAN</div>
                <div className="certificateRole">FOUNDER &amp; INSTRUCTOR</div>
                <div className="certificateId">CERTIFICATE ID · {cert.certificate_id}</div>
              </div>
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
