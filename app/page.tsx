import Image from 'next/image';
import Link from 'next/link';
import { session } from '@/lib/auth';
import db from '@/lib/db';
import CourseThumbnail from '@/app/components/CourseThumbnail';
import HomeMotion from '@/app/components/HomeMotion';
import s from './home.module.css';

const roles=[
 ['Jul 2026 — Present','Security Operations Center Analyst','Alignerr'],
 ['Jul 2026 — Present','Information Security Intern','Commercial International Bank (CIB Egypt)'],
 ['Jun 2026 — Present','Network Engineer (Contract)','Internet Society'],
 ['Feb 2026 — Present','CTF Player & Digital Forensics Analyst','Information Technology Institute'],
 ['Apr 2026 — Present','Founder & Chairman','Sudo Academy']
];
const projects=[
 ['Artifact Hunter','Digital Forensics','Python · FastAPI · Volatility · Wireshark'],
 ['Smart Environmental Regulation & Embedded Robotic Platform','Embedded Systems','C++ · Embedded C · Arduino'],
 ['Optimized Database Application Framework','Web Platform','JavaScript · SQL · HTML · CSS']
];

export default async function Home(){
 const user=await session();
 const courses=await db`select c.id,c.title,c.slug,c.description,c.category,c.level,c.duration_minutes,c.thumbnail_url,c.is_free,c.price,count(l.id)::int as lesson_count from courses c left join lessons l on l.course_id=c.id and l.published=true where c.published=true group by c.id order by c.created_at desc limit 4`;
 return <main className={s.home}>
  <HomeMotion/>
  <div className={s.atmosphere} aria-hidden="true"><span/><span/><span/></div>
  <header className={s.header}>
   <Link className={s.brand} href="/" aria-label="Marwan Swedan home"><span className={s.mark}>MS</span><span><b>Marwan Swedan</b><small>Cybersecurity · Academy</small></span></Link>
   <div className={s.headerRight}><span className={s.availability}><i/> Available for technical work</span><button className={s.menuButton} data-menu-toggle aria-expanded="false" aria-controls="site-menu"><span>Menu</span><i className={s.hamburger}><b/><b/><b/></i></button></div>
  </header>

  <aside className={s.menu} id="site-menu" aria-hidden="true">
   <button className={s.menuBackdrop} data-menu-close aria-label="Close menu"/>
   <div className={s.menuPanel}>
    <div className={s.menuTop}><span>Navigation</span><button data-menu-close>Close <b>×</b></button></div>
    <nav className={s.menuLinks}>
     <Link href="/" data-menu-link><small>01</small><span>Home</span><b>↗</b></Link>
     <Link href="/courses" data-menu-link><small>02</small><span>Academy</span><b>↗</b></Link>
     <Link href="/paths" data-menu-link><small>03</small><span>Learning Paths</span><b>↗</b></Link>
     <a href="#experience" data-menu-link><small>04</small><span>Experience</span><b>↓</b></a>
     <a href="#projects" data-menu-link><small>05</small><span>Projects</span><b>↓</b></a>
     {user&&<Link href="/dashboard" data-menu-link><small>06</small><span>Dashboard</span><b>↗</b></Link>}
     {user?.role==='admin'&&<Link href="/admin" data-menu-link><small>07</small><span>Admin</span><b>↗</b></Link>}
    </nav>
    <div className={s.menuFooter}><span>MARWAN SWEDAN · 2026</span><a href="https://www.linkedin.com/in/marwan-swedan" target="_blank" rel="noreferrer">LinkedIn ↗</a></div>
   </div>
  </aside>

  <section className={s.hero}>
   <div className={s.heroCopy}>
    <p className={s.eyebrow}>Cybersecurity · SOC · Network Engineering</p>
    <h1 data-hero-title><span>Security</span><span>built with</span><span>clarity.</span></h1>
    <p className={s.heroLead}>Cybersecurity analyst focused on security operations, digital forensics, network analysis and practical technical education.</p>
    <div className={s.actions}><Link className={s.primary} href="/courses">Explore Academy <b>↗</b></Link><a className={s.secondary} href="#projects">View selected work <b>↓</b></a></div>
    <div className={s.facts}><div><strong>TOP 27</strong><span>Digital Forensics / CTF</span></div><div><strong>3.77</strong><span>GPA · PUA</span></div><div><strong>150+</strong><span>Students mentored</span></div></div>
   </div>
   <div className={s.heroVisual} data-hero-visual>
    <div className={s.grid} aria-hidden="true"/><div className={s.nodes} aria-hidden="true"><i/><i/><i/><i/><i/></div>
    <div className={s.imageFrame}><Image src="/images/profile.jpg" alt="Marwan Swedan" fill priority sizes="(max-width: 900px) 100vw, 46vw" style={{objectFit:'cover',objectPosition:'center 28%'}}/></div>
    <div className={s.signal}><span>SEC / NET / DFIR</span><i/></div><div className={s.visualIndex}>MS / 26</div>
   </div>
  </section>

  <section className={s.intro}><div className={s.sectionTag}>01 — PROFILE</div><p>I work where <em>defense, investigation and education</em> meet — building practical systems and turning technical complexity into useful knowledge.</p></section>

  <section className={s.academy} id="academy">
   <div className={s.sectionHead}><div><p className={s.sectionTag}>02 — ACADEMY</p><h2>Learn by <em>building.</em></h2></div><Link href="/courses">View all courses ↗</Link></div>
   <div className={s.courseGrid}>{courses.map((c:any,i:number)=><Link className={s.courseCard} href={`/courses/${c.slug}`} key={c.id} data-reveal data-tilt><div className={s.courseImage}><CourseThumbnail src={c.thumbnail_url} category={c.category} alt={c.title}/><span>0{i+1}</span></div><div className={s.courseBody}><small>{c.category||'Cybersecurity'} · {c.level||'Beginner'}</small><h3>{c.title}</h3><div><span>{c.lesson_count} lessons</span><b>{c.is_free?'Free':`${Number(c.price||0).toLocaleString()} EGP`}</b></div></div></Link>)}</div>
   {courses.length===0&&<div className={s.empty}>New courses are being prepared. Check the Academy soon.</div>}
  </section>

  <section className={s.experience} id="experience">
   <div className={s.sectionTag}>03 — EXPERIENCE</div><div className={s.experienceGrid}><div><h2>Security work<br/>with <em>context.</em></h2><p>Experience across SOC operations, information security, network engineering, digital forensics and technical leadership.</p></div><div className={s.timeline}>{roles.map((r,i)=><article key={r[1]+r[2]} data-reveal><span>0{i+1}</span><div><h3>{r[1]}</h3><p>{r[2]}</p><time>{r[0]}</time></div><b>↗</b></article>)}</div></div>
  </section>

  <section className={s.projects} id="projects">
   <div className={s.sectionTag}>04 — SELECTED WORK</div><div className={s.sectionHead}><h2>Built. Tested. <em>Investigated.</em></h2><span>Python · Networks · Digital Forensics</span></div>
   <div className={s.projectGrid}>{projects.map((p,i)=><article className={s.projectCard} key={p[0]} data-reveal data-tilt><span>0{i+1} / {p[1]}</span><h3>{p[0]}</h3><p>{p[2]}</p><b>↗</b></article>)}</div>
  </section>

  <section className={s.cta}><p className={s.sectionTag}>05 — KEEP GOING</p><h2>Stay curious.<br/><em>Keep building.</em></h2><p>Explore practical cybersecurity courses and learning paths through the Academy.</p><Link className={s.primary} href="/courses">Enter Academy ↗</Link></section>

  <footer className={s.footer}><div><Link className={s.brand} href="/"><span className={s.mark}>MS</span><span><b>Marwan Swedan</b><small>Cybersecurity · Academy</small></span></Link><p>Cybersecurity · Digital Forensics · Security Operations · Education</p></div><div><span>EXPLORE</span><Link href="/courses">Academy</Link><Link href="/paths">Learning Paths</Link>{user&&<Link href="/dashboard">Dashboard</Link>}</div><div><span>CONNECT</span><a href="https://www.linkedin.com/in/marwan-swedan" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://wa.me/201515227612" target="_blank" rel="noreferrer">WhatsApp ↗</a></div><small>© 2026 Marwan Swedan</small></footer>
 </main>;
}
