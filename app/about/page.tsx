import Image from 'next/image';
import Link from 'next/link';
import type {Metadata} from 'next';

const siteUrl='https://marwanswedan.online';
const profileImage=siteUrl+'/images/profile.jpg';

const profiles=[
 {name:'LinkedIn',url:'https://eg.linkedin.com/in/marwan-swedan'},
 {name:'Facebook',url:'https://www.facebook.com/share/19efBQt717/'},
 {name:'Instagram',url:'https://www.instagram.com/marwan_swedan_/'},
 {name:'TikTok',url:'https://www.tiktok.com/@marwan_swedan'},
];

const experience=[
 {period:'Jul 2026 — Present',role:'Security Operations Center Analyst',organization:'Alignerr'},
 {period:'Jul 2026 — Present',role:'Information Security Intern',organization:'Commercial International Bank (CIB Egypt)'},
 {period:'Jul 2026 — Present',role:'Member',organization:'International Association of Engineers (IAENG)'},
 {period:'Jun 2026 — Present',role:'Network Engineer (Contract)',organization:'Internet Society'},
 {period:'Feb 2026 — Present',role:'CTF Player & Digital Forensics Analyst',organization:'Information Technology Institute (ITI)'},
 {period:'Apr 2026 — Present',role:'Founder & Chairman',organization:'Sudo Academy'},
 {period:'Apr 2026 — May 2026',role:'Cyber Security Instructor',organization:'Pharos University in Alexandria (PUA)'},
 {period:'Mar 2026 — May 2026',role:'Back-End Developer & HR Specialist',organization:'IEEE PUA Student Branch'},
];

const projects=[
 {name:'ZeroTrace',area:'Cybersecurity · Network Analysis',stack:'Open-source network traffic monitoring and suspicious-activity detection tool. Its public project post reports 98.2% model accuracy using a Random Forest classifier trained on a CICIDS2017-like dataset.'},
 {name:'PASSCHK',area:'Cybersecurity · Password Security',stack:'Open-source password-strength assessment tool for Windows and Linux, designed to help users identify weak passwords and reduce brute-force risk.'},
 {name:'Artifact Hunter',area:'Digital Forensics',stack:'Python · FastAPI · Volatility · Wireshark'},
 {name:'Smart Environmental Regulation & Embedded Robotic Platform',area:'Embedded Systems',stack:'C++ · Embedded C · Arduino'},
 {name:'Optimized Database Application Framework',area:'Web Platform',stack:'JavaScript · SQL · HTML · CSS'},
];

const credentials=[
 'LetsDefend — SOC Member',
 'Netriders — System Operator Certification (SOC)',
 'Netriders — Digital Forensics Fundamentals',
 'Basel Institute on Governance — Open-Source Intelligence (OSINT)',
 'ITI — Global Cyber Championship CTF',
 'IBM — Incident Response & Digital Forensics',
 'MaharaTech — Incident Handling & Response',
 'MaharaTech — Digital Forensics and Investigations',
 'Cisco — Network Basics Certificate',
 'Cisco — Introduction to Cybersecurity',
];

const linkedinCredentials=[
 {name:'Cloud and Virtualization Concepts',issuer:'MaharaTech — ITIMooca',date:'November 2025',id:'0qr8VbhY4q'},
 {name:'Cybersecurity ITI',issuer:'MaharaTech — ITIMooca',date:'November 2025',id:'ajv5UEcgyB'},
 {name:'Introduction to Network Security',issuer:'MaharaTech — ITIMooca',date:'November 2025',id:'pZnimaqJr0'},
 {name:'Network Virtualization Concepts',issuer:'MaharaTech — ITIMooca',date:'November 2025',id:'Spgmab5CdL'},
 {name:'Red Hat System Administration I',issuer:'MaharaTech — ITIMooca',date:'November 2025',id:'HUOVZY54HW'},
 {name:'Cisco Python Essentials 1',issuer:'Cisco',date:'August 2025'},
 {name:'Ethical Hacking',issuer:'Great Learning',date:'August 2025'},
 {name:'Introduction to Cybersecurity',issuer:'Cisco',date:'August 2025'},
 {name:'EF SET English Certificate',issuer:'EF SET',date:'December 2024'},
 {name:'EF SET English Certificate — 62/100 (C1 Advanced)',issuer:'EF SET',date:'Date not displayed'},
];

const additionalTraining=[
 'Advanced Digital Forensics: File Systems, Mobile Devices, and OSINT — MaharaTech / ITI MOOC',
 'Digital Forensics: Analyzing Memory and Network Traffic — MaharaTech / ITI MOOC',
 'Generative AI program — CIB Egypt Summer Training Program',
];

const person={
 '@context':'https://schema.org',
 '@type':'Person',
 '@id':siteUrl+'/#person',
 name:'Marwan Swedan',
 alternateName:['مروان سويدان','Marwan Swaidan','MarwanSwedan'],
 url:siteUrl+'/about',
 image:[profileImage],
 description:'Marwan Swedan (مروان سويدان) is an Egyptian Computer Science and Artificial Intelligence student focused on cybersecurity, security operations, digital forensics, incident response, and cybersecurity education. He is the founder of PROVENRA and Sudo Academy.',
 jobTitle:['Cybersecurity Analyst','Digital Forensics Practitioner','Cybersecurity Educator'],
 worksFor:[
  {'@type':'Organization',name:'PROVENRA',url:siteUrl},
  {'@type':'Organization',name:'Sudo Academy'},
 ],
 memberOf:[{'@type':'Organization',name:'International Association of Engineers (IAENG)'}],
 affiliation:[
  {'@type':'Organization',name:'Pharos University in Alexandria'},
  {'@type':'Organization',name:'IEEE PUA Student Branch'},
  {'@type':'Organization',name:'Information Technology Institute (ITI)'},
 ],
 sameAs:profiles.map(profile=>profile.url),
 knowsAbout:[
  'Cybersecurity','Information Security','Security Operations Center (SOC)','Security Information and Event Management (SIEM)',
  'Incident Response','Threat Hunting','Digital Forensics','Memory Forensics','Digital Evidence','Open-Source Intelligence (OSINT)',
  'Network Security','PCAP Analysis','Python','C++','JavaScript','SQL','Cybersecurity Education'
 ],
 hasCredential:[...credentials,...linkedinCredentials.map(item=>item.name)].map(name=>({
  '@type':'EducationalOccupationalCredential',
  name,
  credentialCategory:'certificate'
 })),
 award:[
  'Ranked 27th across Egypt with his team in the Global Cyber Champion digital forensics competition, and among the Top 500 competitors worldwide',
  'Ideal Student recognition, Faculty of Computer Science and Artificial Intelligence, Pharos University in Alexandria, academic year 2025/2026'
 ],
};

const webpage={
 '@context':'https://schema.org',
 '@type':'ProfilePage',
 '@id':siteUrl+'/about#webpage',
 url:siteUrl+'/about',
 name:'Marwan Swedan | مروان سويدان — Official Biography',
 inLanguage:['en','ar'],
 mainEntity:{'@id':siteUrl+'/#person'},
};

export const metadata:Metadata={
 title:'Marwan Swedan | مروان سويدان — Official Biography',
 description:'Official bilingual biography and professional profile of Marwan Swedan (مروان سويدان): cybersecurity, SOC operations, digital forensics, incident response, education, projects, selected certifications, and PROVENRA.',
 keywords:[
  'Marwan Swedan','Marwan Swaidan','MarwanSwedan','مروان سويدان',
  'Marwan Swedan cybersecurity','Marwan Swedan digital forensics','مروان سويدان أمن سيبراني',
  'مروان سويدان تحقيق جنائي رقمي','Cybersecurity Analyst Egypt','Digital Forensics Egypt','PROVENRA'
 ],
 alternates:{
  canonical:siteUrl+'/about',
  languages:{'en':siteUrl+'/about','ar':siteUrl+'/about','x-default':siteUrl+'/about'}
 },
 robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
 openGraph:{
  type:'profile',
  title:'Marwan Swedan | مروان سويدان',
  description:'Official bilingual biography of Marwan Swedan — cybersecurity, SOC operations, digital forensics, incident response, and founder of PROVENRA.',
  url:siteUrl+'/about',
  locale:'en_US',
  alternateLocale:['ar_EG'],
  images:[{url:'/images/profile.jpg',width:1200,height:1200,alt:'Marwan Swedan — مروان سويدان'}],
 },
 twitter:{
  card:'summary_large_image',
  title:'Marwan Swedan | مروان سويدان',
  description:'Official bilingual profile — Cybersecurity, Digital Forensics, SOC Operations, and PROVENRA.',
  images:[profileImage],
 },
};

export default function AboutPage(){
 return <main>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify([person,webpage])}}/>
  <div className="shell">
   <nav className="nav"><Link className="brand" href="/">PROVENRA</Link><div className="navlinks"><Link href="/">Home</Link><Link href="/courses">Academy</Link></div></nav>
   <section className="hero" style={{minHeight:'auto',padding:'70px 0'}}>
    <div className="heroCopy">
     <div className="eyebrow">Official Personal Profile · الملف الشخصي الرسمي</div>
     <h1>Marwan<br/><span>Swedan.</span></h1>
     <h2 style={{fontSize:24,margin:'0 0 18px',color:'var(--accent)'}}>مروان سويدان</h2>
     <p>Cybersecurity and Digital Forensics practitioner focused on security operations, incident response, threat analysis, and practical cybersecurity education. Founder of PROVENRA and Sudo Academy.</p>
     <p dir="rtl" lang="ar">مروان سويدان طالب في علوم الحاسب والذكاء الاصطناعي، مهتم بالأمن السيبراني وعمليات مراكز العمليات الأمنية والتحقيق الجنائي الرقمي والاستجابة للحوادث وتحليل التهديدات. مؤسس PROVENRA وSudo Academy.</p>
     <div className="actions"><a className="btn primary" href="https://eg.linkedin.com/in/marwan-swedan" target="_blank" rel="me noreferrer">Official LinkedIn ↗</a><Link className="btn" href="/courses">PROVENRA Academy</Link></div>
    </div>
    <div className="heroVisual" style={{minHeight:430}}><Image src="/images/profile.jpg" alt="Marwan Swedan — مروان سويدان, official profile portrait" fill priority sizes="(max-width: 900px) 100vw, 50vw" style={{objectFit:'cover',objectPosition:'center 32%'}}/></div>
   </section>

   <section className="section compact">
    <div className="eyebrow">Biography · السيرة الذاتية</div>
    <h2>Professional profile</h2>
    <p>Marwan Swedan is an Egyptian cybersecurity learner and practitioner whose interests and work span Security Operations Center (SOC) operations, defensive security, digital forensics, incident response, threat analysis, and cybersecurity education. His public portfolio brings together technical projects, academic work, professional activities, and selected credentials. He founded PROVENRA, a cybersecurity education platform, and Sudo Academy, through which he develops learning paths and practical training experiences.</p>
    <h3 dir="rtl" lang="ar">نبذة مهنية</h3>
    <p dir="rtl" lang="ar">مروان سويدان مهتم بمجالات الأمن السيبراني والأمن الدفاعي وعمليات مراكز العمليات الأمنية (SOC) والتحقيق الجنائي الرقمي والاستجابة للحوادث وتحليل التهديدات. يجمع ملفه المهني بين المشروعات التقنية والدراسة الأكاديمية والأنشطة المهنية والتعليم التقني. أسس منصة PROVENRA للتعليم في مجال الأمن السيبراني، كما أسس Sudo Academy لتطوير المسارات التعليمية والتدريب العملي.</p>
   </section>

   <section className="section compact">
    <div className="eyebrow">Education · التعليم</div><h2>Academic background</h2>
    <div className="projectGrid">
     <article className="projectCard"><span>University</span><h3>Pharos University in Alexandria (PUA)</h3><p>Bachelor's degree track in Computer Science and Artificial Intelligence.</p><p>Current CGPA: <strong>3.64 / 4.00</strong> · Expected graduation: June 2029.</p></article>
     <article className="projectCard"><span>الجامعة</span><h3 dir="rtl">جامعة فاروس بالإسكندرية</h3><p dir="rtl">يدرس علوم الحاسب والذكاء الاصطناعي. المعدل التراكمي الحالي 3.64 من 4.00، والتخرج المتوقع في يونيو 2029.</p></article>
    </div>
   </section>

   <section className="section compact">
    <div className="eyebrow">Professional experience · الخبرات والأنشطة</div><h2>Experience and affiliations</h2>
    <div className="timeline">{experience.map(item=><div className="role" key={item.role+item.organization}><time>{item.period}</time><div><h3>{item.role}</h3><p>{item.organization}</p></div></div>)}</div>
   </section>

   <section className="section compact">
    <div className="eyebrow">Projects · المشروعات</div><h2>Selected technical projects</h2>
    <div className="projectGrid">{projects.map(project=><article className="projectCard" key={project.name}><span>{project.area}</span><h3>{project.name}</h3><p>{project.stack}</p></article>)}</div>
   </section>

   <section className="section compact">
    <div className="eyebrow">Recognition · الإنجازات</div><h2>Highlights</h2>
    <div className="projectGrid">
     <article className="projectCard"><span>Digital forensics · 2026</span><h3>Top 27 in Egypt · Top 500 worldwide</h3><p>Competed in the Global Cyber Champion competition in the digital forensics track, solving all challenges. His team ranked 27th across Egypt, and he reported an individual placement among the Top 500 competitors worldwide.</p></article>
     <article className="projectCard"><span>Leadership · Sudo Academy</span><h3>Founder & Chairman</h3><p>Founded Sudo Academy and developed cybersecurity, networking, and programming curricula and practical assessment paths, mentoring more than 150 students.</p></article>
     <article className="projectCard"><span>University recognition</span><h3>Ideal Student 2025/2026</h3><p>Recognized as an Ideal Student for the 2025/2026 academic year.</p></article>
    </div>
   </section>

   <section className="section compact">
    <div className="eyebrow">Technical knowledge · المهارات التقنية</div><h2>Areas of focus</h2>
    <div className="certRow">
     <div className="cert">SOC Operations · SIEM · Incident Response · Threat Hunting</div>
     <div className="cert">Digital Forensics · Memory Analysis · PCAP Triage</div>
     <div className="cert">Python · C++ · JavaScript · SQL · REST APIs</div>
     <div className="cert">Wireshark · Volatility · Autopsy · FTK Imager · Wazuh</div>
     <div className="cert">Network Security · OSINT · Defensive Security</div>
    </div>
   </section>

   <section className="section compact">
    <div className="eyebrow">Selected credentials · الشهادات والاعتمادات</div><h2>Selected certifications</h2>
    <p className="muted">The public portfolio currently lists 33 certifications and credentials. The following ten are highlighted here; the landing page intentionally keeps this short selection.</p>
    <div className="certRow">{credentials.map(item=><div className="cert" key={item}>{item}</div>)}</div>
   </section>

   <section className="section compact">
    <div className="eyebrow">LinkedIn credentials · شهادات لينكدإن</div><h2>Licenses and certifications</h2>
    <div className="projectGrid">{linkedinCredentials.map(item=><article className="projectCard" key={item.name}><span>{item.issuer}</span><h3>{item.name}</h3><p>{item.date}{item.id?' · Credential ID: '+item.id:''}</p></article>)}</div>
   </section>

   <section className="section compact">
    <div className="eyebrow">Additional training · برامج ودورات إضافية</div><h2>Professional development</h2>
    <div className="certRow">{additionalTraining.map(item=><div className="cert" key={item}>{item}</div>)}</div>
    <p className="muted" style={{marginTop:18}}>English proficiency: EF SET 62/100 — C1 Advanced, as displayed on the public LinkedIn profile.</p>
   </section>

   <section className="section compact">
    <div className="eyebrow">Official accounts · الحسابات الرسمية</div><h2>Find Marwan Swedan online</h2>
    <p className="muted">These public profiles are associated with this official website and represent the same person: Marwan Swedan (مروان سويدان).</p>
    <div className="projectGrid">{profiles.map(profile=><a className="projectCard" href={profile.url} key={profile.name} target="_blank" rel="me noopener noreferrer" style={{minHeight:130}}><span>Official profile</span><h3 style={{marginTop:24}}>{profile.name} ↗</h3><p>Marwan Swedan · مروان سويدان</p></a>)}</div>
   </section>

   <footer className="footer"><div><div className="brand">PROVENRA</div><p>Official profile of Marwan Swedan.</p><p>Cybersecurity · Digital Forensics · Education</p></div><div><h4>Explore</h4><Link href="/">Home</Link><Link href="/courses">Academy</Link></div><div><h4>Connect</h4>{profiles.map(profile=><a href={profile.url} key={profile.name} target="_blank" rel="me noopener noreferrer">{profile.name} ↗</a>)}</div><div><h4>Official website</h4><a href={siteUrl}>marwanswedan.online ↗</a></div></footer>
  </div>
 </main>;
}
