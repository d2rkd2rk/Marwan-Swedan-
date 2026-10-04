import Image from 'next/image'
import Link from 'next/link'
import { session } from '@/lib/auth'
import db from '@/lib/db'
import CourseThumbnail from '@/app/components/CourseThumbnail'
import HomeMotion from '@/app/components/HomeMotion'
import s from './home.module.css'

const roles = [
  ['Jul 2026 — Present', 'Security Operations Center Analyst', 'Alignerr'],
  ['Jul 2026 — Present', 'Information Security Intern', 'Commercial International Bank (CIB Egypt)'],
  ['Jun 2026 — Present', 'Network Engineer (Contract)', 'Internet Society'],
  ['Feb 2026 — Present', 'CTF Player & Digital Forensics Analyst', 'Information Technology Institute'],
  ['Apr 2026 — Present', 'Founder & Chairman', 'Sudo Academy'],
]

const projects = [
  ['Artifact Hunter', 'Digital Forensics', 'Python · FastAPI · Volatility · Wireshark'],
  ['Smart Environmental Regulation & Embedded Robotic Platform', 'Embedded Systems', 'C++ · Embedded C · Arduino'],
  ['Optimized Database Application Framework', 'Web Platform', 'JavaScript · SQL · HTML · CSS'],
]

export default async function Home() {
  const user = await session()
  const courses = await db`select c.id,c.title,c.slug,c.description,c.category,c.level,c.duration_minutes,c.thumbnail_url,c.is_free,c.price,count(l.id)::int as lesson_count from courses c left join lessons l on l.course_id=c.id and l.published=true where c.published=true group by c.id order by c.created_at desc limit 4`

  return (
    <main className={s.home}>
      <HomeMotion />
      <div className={s.beams} aria-hidden="true"><span/><span/><span/><div className={s.heroGrid}/><div className={s.heroGlow}/></div>

      <header className={s.header}>
        <Link href="/" className={s.brand} aria-label="Marwan Swedan home">
          <span className={s.mark}>MS</span>
          <span><b>Marwan Swedan</b><small>Cybersecurity · Academy</small></span>
        </Link>
        <div className={s.headerRight}>
          <span className={s.availability}><i/> Available for technical work</span>
          <button className={s.menuButton} data-menu-toggle aria-expanded="false" aria-controls="site-menu">
            <span>Menu</span><i className={s.hamburger}><b/><b/><b/></i>
          </button>
        </div>
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
            {user && <Link href="/dashboard" data-menu-link><small>06</small><span>Dashboard</span><b>↗</b></Link>}
            {user?.role === 'admin' && <Link href="/admin" data-menu-link><small>07</small><span>Admin</span><b>↗</b></Link>}
          </nav>
          <div className={s.menuFooter}><span>MARWAN SWEDAN · 2026</span><a href="https://www.linkedin.com/in/marwan-swedan" target="_blank" rel="noreferrer">LinkedIn ↗</a></div>
        </div>
      </aside>

      <section id="top" className={s.hero}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>CYBERSECURITY · EDUCATION · RESILIENCE</p>
          <h1 data-hero-title>Securing Systems.<br/><span>Empowering Minds.</span></h1>
          <p className={s.heroLead}>Cybersecurity analyst focused on security operations, digital forensics, network analysis and practical technical education.</p>
          <div className={s.actions}>
            <Link href="#projects" className={s.primary}>View Portfolio <b>↗</b></Link>
            <Link href="/courses" className={s.secondary}>Explore Academy <b>→</b></Link>
          </div>
          <div className={s.status}><i/> Available for technical work <span>/</span> 2026</div>
        </div>
        <div className={s.heroVisual} data-hero-visual>
          <div className={s.visualGrid}/>
          <div className={s.imageFrame}><Image src="/images/profile.jpg" alt="Marwan Swedan" fill priority sizes="(max-width: 900px) 100vw, 46vw" style={{objectFit:'cover',objectPosition:'center 28%'}}/></div>
          <div className={s.visualGlow}/>
          <div className={s.signal}><span>SEC / NET / DFIR</span><i/></div>
          <div className={s.visualIndex}>MS / 26</div>
        </div>
      </section>

      <section className={s.work} id="work">
        <div className={s.sectionHead}>
          <div><p className={s.sectionEyebrow}>SELECTED EXPERTISE</p><h2>Clarity in the<br/><span>complex.</span></h2></div>
          <p>Security work that is rigorous under the hood and legible to everyone in the room.</p>
        </div>
        <div className={s.expertiseGrid}>
          {[
            ['01 / OPERATIONS','SOC Operations','Turning signals into certainty with calm, methodical incident response.','SIEM · IR'],
            ['02 / INFRASTRUCTURE','Network Engineering','Resilient systems built for the moments that matter.','NETWORKS · CLOUD'],
            ['03 / AUTOMATION','Python Tooling','Small tools. Significant leverage. Less noise in every workflow.','PYTHON · API · CLI'],
          ].map((item, index) => (
            <article key={item[1]} className={s.expertiseCard} data-reveal data-tilt>
              <div><small>{item[0]}</small><b>↗</b></div>
              <div><h3>{item[1]}</h3><p>{item[2]}</p><span>{item[3]}</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className={s.academy} id="academy">
        <div className={s.sectionHead}>
          <div><p className={s.sectionEyebrow}>MARWAN SWEDAN ACADEMY</p><h2>Learn to see<br/><span>what others miss.</span></h2></div>
          <p>No filler. Practical cybersecurity courses and learning paths built around useful skills.</p>
        </div>
        <div className={s.courseGrid}>
          {courses.map((c:any, i:number) => (
            <Link className={s.courseCard} href={`/courses/${c.slug}`} key={c.id} data-reveal data-tilt>
              <div className={s.courseImage}><CourseThumbnail src={c.thumbnail_url} category={c.category} alt={c.title}/><span>0{i+1}</span></div>
              <div className={s.courseBody}>
                <div className={s.courseMeta}><span>{c.category || 'Cybersecurity'}</span><span>{c.level || 'Beginner'}</span></div>
                <h3>{c.title}</h3>
                <p>{c.description || 'Practical cybersecurity learning built around real technical skills.'}</p>
                <div className={s.courseBottom}><span>{c.lesson_count} lessons</span><b>{c.is_free ? 'Free' : `${Number(c.price || 0).toLocaleString()} EGP`} ↗</b></div>
              </div>
            </Link>
          ))}
        </div>
        {courses.length === 0 && <div className={s.empty}>New courses are being prepared. Check the Academy soon.</div>}
        <div className={s.academyLink}><Link href="/courses">View all courses <b>↗</b></Link><Link href="/paths">Explore learning paths <b>↗</b></Link></div>
      </section>

      <section className={s.experience} id="experience">
        <div className={s.sectionEyebrow}>EXPERIENCE</div>
        <div className={s.experienceGrid}>
          <div><h2>Security work<br/>with <span>context.</span></h2><p>Experience across SOC operations, information security, network engineering, digital forensics and technical leadership.</p></div>
          <div className={s.timeline}>
            {roles.map((r:any, i:number) => <article key={r[1] + r[2]} data-reveal><span>0{i+1}</span><div><h3>{r[1]}</h3><p>{r[2]}</p><time>{r[0]}</time></div><b>↗</b></article>)}
          </div>
        </div>
      </section>

      <section className={s.projects} id="projects">
        <div className={s.sectionHead}><div><p className={s.sectionEyebrow}>SELECTED WORK</p><h2>Built. Tested.<br/><span>Investigated.</span></h2></div><p>Python · Networks · Digital Forensics</p></div>
        <div className={s.projectGrid}>
          {projects.map((p:any, i:number) => <article className={s.projectCard} key={p[0]} data-reveal data-tilt><span>0{i+1} / {p[1]}</span><h3>{p[0]}</h3><p>{p[2]}</p><b>↗</b></article>)}
        </div>
      </section>

      <section className={s.cta} id="contact">
        <div className={s.ctaInner}><p className={s.sectionEyebrow}>MARWAN SWEDAN ACADEMY</p><h2>Keep learning.<br/><span>Keep building.</span></h2><p>Explore practical cybersecurity courses and learning paths through the Academy.</p><Link href="/courses" className={s.primary}>Enter Academy <b>↗</b></Link></div>
      </section>

      <footer className={s.footer}>
        <div><Link className={s.brand} href="/"><span className={s.mark}>MS</span><span><b>Marwan Swedan</b><small>Cybersecurity · Academy</small></span></Link><p>Cybersecurity · Digital Forensics · Security Operations · Education</p></div>
        <div><span>EXPLORE</span><Link href="/courses">Academy</Link><Link href="/paths">Learning Paths</Link>{user && <Link href="/dashboard">Dashboard</Link>}</div>
        <div><span>CONNECT</span><a href="https://www.linkedin.com/in/marwan-swedan" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://wa.me/201515227612" target="_blank" rel="noreferrer">WhatsApp ↗</a></div>
        <small>© 2026 Marwan Swedan</small>
      </footer>
    </main>
  )
}
