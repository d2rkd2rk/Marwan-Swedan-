import Image from 'next/image';
import Link from 'next/link';
import {session} from '@/lib/auth';
import db from '@/lib/db';
import Animations from './Animations';
import SiteNav from '@/app/components/SiteNav';
import s from '../home.module.css';

const roles=[['Jul 2026 — Present','Security Operations Center Analyst','Alignerr'],['Jul 2026 — Present','Information Security Intern','Commercial International Bank (CIB Egypt)'],['Jul 2026 — Present','Member','International Association of Engineers (IAENG)'],['Jun 2026 — Present','Network Engineer (Contract)','Internet Society'],['Feb 2026 — Present','CTF Player & Digital Forensics Analyst','Information Technology Institute'],['Apr 2026 — Present','Founder & Chairman','Sudo Academy'],['Apr 2026 — May 2026','Cyber Security Instructor','Pharos University in Alexandria (PUA)'],['Mar 2026 — May 2026','Back-End Developer & HR Specialist','IEEE PUA Student Branch']];
const featuredCerts=['LetsDefend — SOC Member','Netriders — System Operator Certification (SOC)','Netriders — Digital Forensics Fundamentals','Basel Institute on Governance — Open-Source Intelligence (OSINT)','ITI — Global Cyber Championship CTF','IBM — Incident Response & Digital Forensics','MaharaTech — Incident Handling & Response','MaharaTech — Digital Forensics and Investigations','Cisco — Network Basics Certificate','Cisco — Introduction to Cybersecurity'];
const totalCerts=33;
const focus=[['01','Cybersecurity','SOC · Incident Response · Threat Hunting'],['02','Digital Forensics','Memory · PCAP · Investigation'],['03','Engineering','Python · C++ · JavaScript · SQL'],['04','Building','Academy · Teaching · Real Projects']];

export default async function Landing(){
 const user=await session();
 const courses=await db\`select c.id,c.title,c.slug,c.description,c.level,c.thumbnail_url,c.duration_minutes,count(l.id)::int as lesson_count from courses c left join lessons l on l.course_id=c.id and l.published=true where c.published=true group by c.id order by c.created_at desc limit 3\`;
 return <main className={s.page}>
  <div className={s.ambient}/><div className={s.cursorGlow}/><div className={s.noise}/>
  <div className={s.wrap}>
   <SiteNav initialUser={user?{username:user.username,role:user.role}:null}/>
   <section className={s.hero+' '+s.heroCinematic}>
    <div className={s.heroKicker}><span className={s.dot}/>CYBERSECURITY · BUILDER · EDUCATOR</div>
    <div className={s.copy}>
      <div className={s.heroIndex}>01 / INTRO</div>
      <h1 className={s.heroTitle}><span>MARWAN</span><em>SWEDAN</em></h1>
      <p className={s.heroLead}>Cybersecurity analyst building practical skills, digital-forensics experience and an academy for the next generation of tech learners.</p>
      <div className={s.actions}><Link className={s.primary+' '+s.btn} href="/courses">Enter Academy <span>↗</span></Link><a className={s.btn} href="#experience">Explore Portfolio <span>↓</span></a></div>
    </div>
    <div className={s.heroArt}><Image className={s.heroImg} src="/images/profile.jpg" alt="Marwan Swedan" fill priority sizes="(max-width:900px) 100vw,55vw"/><div className={s.heroOrb}/><div className={s.heroFrame}><span>BASED IN EGYPT</span><span>AVAILABLE FOR COLLABORATION</span></div></div>
    <div className={s.heroBottom}><span>SCROLL TO EXPLORE</span><span className={s.scrollLine}/><span>2026 — PRESENT</span></div>
   </section>

   <section className={s.marquee} aria-label="Areas of focus"><div className={s.marqueeTrack}>{['CYBERSECURITY','DIGITAL FORENSICS','SOC','NETWORKING','PROGRAMMING','ACADEMY','CYBERSECURITY','DIGITAL FORENSICS','SOC','NETWORKING','PROGRAMMING','ACADEMY'].map((x,i)=><span key={i}>{x}<b>✦</b></span>)}</div></section>

   <section id="about" className={s.aboutStage+' '+s.section}>
    <div className={s.sectionNumber}>02</div>
    <div className={s.aboutCopy}><div className={s.label}>ABOUT ME</div><h2>Turning curiosity into <span>capability.</span></h2><p>I work across cybersecurity, networking, digital forensics and software engineering. My focus is simple: learn deeply, build practically, and turn what I learn into useful experiences for other people.</p><div className={s.aboutMeta}><div><b>3.77 / 4.00</b><span>GPA</span></div><div><b>150+</b><span>Students mentored</span></div><div><b>33</b><span>Certifications</span></div></div></div>
    <div className={s.focusGrid}>{focus.map(([n,t,d])=><article className={s.focusCard} key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div><i>↗</i></article>)}</div>
   </section>

   {courses.length>0&&<section className={s.section+' '+s.courseStage}>
    <div className={s.sectionHead}><div><div className={s.label}>03 / ACADEMY</div><h2>Latest courses<span>.</span></h2></div><Link className={s.view} href="/courses">View all ↗</Link></div>
    <div className={s.courses}>{courses.map((c:any,i:number)=><Link href={'/courses/'+c.slug} className={s.course+' '+s.courseCard} key={c.id}><div className={s.courseNo}>0{i+1}</div><div className={s.courseImg}>{c.thumbnail_url&&<div role="img" aria-label={c.title} style={{position:'absolute',inset:0,backgroundImage:'url('+c.thumbnail_url+')',backgroundSize:'cover',backgroundPosition:'center'}}/>}<span className={s.badge}>{c.level||'Beginner'}</span><span className={s.courseArrow}>↗</span></div><div className={s.courseBody}><h3>{c.title}</h3><p>{c.description||'Practical training from Marwan Swedan Academy.'}</p><div className={s.meta}><span>{c.lesson_count} LESSONS</span><span>{c.duration_minutes?(Math.floor(c.duration_minutes/60)+'H '+(c.duration_minutes%60)+'M'):'SELF-PACED'}</span></div></div></Link>)}</div>
   </section>}

   <section id="experience" className={s.section+' '+s.experienceStage}>
    <div className={s.sectionNumber}>04</div><div className={s.sectionHead}><div><div className={s.label}>EXPERIENCE</div><h2>Where I’ve been<span>.</span></h2></div></div>
    <div className={s.experienceList}>{roles.map((r,i)=><article className={s.experienceItem+' '+s.experienceInteractive} key={r[1]+r[2]}><time>0{i+1}<br/>{r[0]}</time><div><h3>{r[1]}</h3><p>{r[2]}</p></div><span className={s.experienceArrow}>↗</span></article>)}</div>
   </section>

   <section id="certifications" className={s.section+' '+s.certStage}>
    <div className={s.certTop}><div><div className={s.label}>05 / CREDENTIALS</div><h2>Proof of work<span>.</span></h2><p>Selected credentials across cybersecurity, networking and digital forensics.</p></div><strong>{totalCerts}<small> CREDENTIALS</small></strong></div>
    <div className={s.certGrid}>{featuredCerts.map((c,i)=><div className={s.certItem+' '+s.certInteractive} key={c}><span>0{i+1}</span><b>{c}</b><i>↗</i></div>)}</div>
   </section>

   <section className={s.journey+' '+s.finalStage}><div className={s.finalNoise}/><div className={s.journeyInner}><div><div className={s.label}>06 / NEXT</div><h2>Let’s build<br/><span>something useful.</span></h2><p>Explore the academy, connect with me, or follow the work as it grows.</p><div className={s.actions}><Link className={s.primary+' '+s.btn} href="/courses">Enter Academy ↗</Link><a className={s.btn} href="https://www.linkedin.com/in/marwan-swedan" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></div><div className={s.finalMark}>MS<span>×</span></div></div></section>

   <footer className={s.footer}><div><div className={s.footerBrand}>MARWAN SWEDAN</div><p>Cybersecurity · Academy · Portfolio</p></div><div><h4>EXPLORE</h4><Link href="/">Home</Link><Link href="/courses">Academy</Link><a href="#about">About</a><a href="#experience">Experience</a><a href="#certifications">Credentials</a></div><div><h4>CONNECT</h4><a href="https://www.linkedin.com/in/marwan-swedan" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://wa.me/201515227612" target="_blank" rel="noreferrer">WhatsApp</a></div><div><h4>STATUS</h4><p><span className={s.statusDot}/> Open to collaboration</p><p>© 2026 Marwan Swedan</p></div></footer>
  </div><Animations/>
 </main>;
}
