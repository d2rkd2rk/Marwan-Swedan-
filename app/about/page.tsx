import Image from 'next/image';
import Link from 'next/link';
import type {Metadata} from 'next';

const siteUrl='https://marwanswedan.online';

export const metadata:Metadata={
 title:'About Marwan Swedan | Cybersecurity & Digital Forensics',
 description:'Official profile of Marwan Swedan (مروان سويدان): cybersecurity, digital forensics, SOC operations, incident response, and founder of PROVENRA.',
 alternates:{canonical:siteUrl+'/about'},
 openGraph:{
  type:'profile',
  title:'Marwan Swedan | مروان سويدان',
  description:'Cybersecurity and digital forensics practitioner. Founder of PROVENRA.',
  url:siteUrl+'/about',
  images:[{url:'/images/profile.jpg',alt:'Marwan Swedan — official profile photo'}],
 },
};

const profiles=[
 {name:'LinkedIn',url:'https://eg.linkedin.com/in/marwan-swedan'},
 {name:'Facebook',url:'https://www.facebook.com/share/19efBQt717/'},
 {name:'Instagram',url:'https://www.instagram.com/marwan_swedan_/'},
 {name:'TikTok',url:'https://www.tiktok.com/@marwan_swedan'},
];

export default function AboutPage(){
 const person={
  '@context':'https://schema.org',
  '@type':'Person',
  '@id':siteUrl+'/#person',
  name:'Marwan Swedan',
  alternateName:['مروان سويدان','Marwan Swaidan'],
  url:siteUrl+'/about',
  image:siteUrl+'/images/profile.jpg',
  jobTitle:'Cybersecurity Analyst and Digital Forensics Practitioner',
  description:'Marwan Swedan (مروان سويدان) focuses on cybersecurity, digital forensics, SOC operations, incident response, and cybersecurity education. Founder of PROVENRA.',
  worksFor:{'@type':'Organization','name':'PROVENRA','url':siteUrl},
  sameAs:profiles.map(profile=>profile.url),
  knowsAbout:['Cybersecurity','Digital Forensics','Security Operations Center','Incident Response','Threat Intelligence','Cybersecurity Education'],
 };
 return <main><div className="shell">
  <nav className="nav"><Link className="brand" href="/">PROVENRA</Link><div className="navlinks"><Link href="/">Home</Link><Link href="/courses">Academy</Link></div><div className="actions" style={{margin:0}}><Link className="btn" href="/">Back to PROVENRA</Link></div></nav>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(person)}}/>
  <section className="hero" style={{minHeight:'auto',padding:'70px 0'}}>
   <div className="heroCopy"><div className="eyebrow">Official Personal Profile</div><h1>Marwan<br/><span>Swedan.</span></h1><h2 style={{fontSize:24,margin:'0 0 18px',color:'var(--accent)'}}>مروان سويدان</h2><p>Cybersecurity and Digital Forensics practitioner, focused on SOC operations, incident response, and practical cybersecurity education. Founder of PROVENRA.</p><div className="actions"><Link className="btn primary" href="/courses">Explore PROVENRA</Link><a className="btn" href="https://eg.linkedin.com/in/marwan-swedan" target="_blank" rel="noreferrer">LinkedIn ↗</a></div></div>
   <div className="heroVisual" style={{minHeight:430}}><Image src="/images/profile.jpg" alt="Marwan Swedan — مروان سويدان" fill priority sizes="(max-width: 900px) 100vw, 50vw" style={{objectFit:'cover',objectPosition:'center 32%'}}/></div>
  </section>
  <section className="section compact"><div className="eyebrow">About</div><h2>Cybersecurity. Digital Forensics. Education.</h2><div className="projectGrid" style={{marginTop:28}}>
   <article className="projectCard"><span>Professional focus</span><h3>Security operations</h3><p>Learning and working across SOC operations, incident response, threat analysis, and defensive security.</p></article>
   <article className="projectCard"><span>Specialization</span><h3>Digital forensics</h3><p>Interested in digital evidence, forensic investigation, memory analysis, and practical investigation workflows.</p></article>
   <article className="projectCard"><span>Education</span><h3>PROVENRA</h3><p>Founder of PROVENRA, a cybersecurity education platform focused on practical skills and guided learning.</p></article>
  </div></section>
  <section className="section compact"><div className="eyebrow">Official accounts</div><h2>Find Marwan Swedan online.</h2><p className="muted" style={{lineHeight:1.8,maxWidth:680}}>These are the public profiles associated with this official website.</p><div className="projectGrid" style={{marginTop:24}}>{profiles.map(profile=><a className="projectCard" href={profile.url} key={profile.name} target="_blank" rel="me noopener noreferrer" style={{minHeight:130}}><span>Official profile</span><h3 style={{marginTop:24}}>{profile.name} ↗</h3><p>Marwan Swedan · مروان سويدان</p></a>)}</div></section>
  <footer className="footer"><div><div className="brand">PROVENRA</div><p>Official profile of Marwan Swedan.</p><p>Cybersecurity · Digital Forensics · Education</p></div><div><h4>Explore</h4><Link href="/">Home</Link><Link href="/courses">Academy</Link></div><div><h4>Connect</h4>{profiles.map(profile=><a href={profile.url} key={profile.name} target="_blank" rel="me noopener noreferrer">{profile.name} ↗</a>)}</div><div><h4>Official website</h4><a href={siteUrl}>marwanswedan.online ↗</a></div></footer>
 </div></main>;
}
