'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';

export default function StudentDashboard(){
 const [data,setData]=useState<any>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  fetch('/api/student/dashboard',{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not load dashboard.');return j}).then(setData).catch(e=>setError(e.message||'Could not load dashboard.'));
 },[]);
 if(error)return <main><div className="shell"><SiteNav/><section className="section"><div className="error">{error}</div><Link className="btn primary" href="/login?next=/dashboard">Sign in</Link></section></div></main>;
 if(!data)return <main><div className="shell"><SiteNav/><section className="section"><p className="muted">Loading your dashboard…</p></section></div></main>;
 const courses=data.courses||[], certificates=data.certificates||[];
 return <main><div className="shell"><SiteNav/><section className="section">
  <div className="eyebrow">Student Dashboard</div>
  <h1 style={{fontFamily:'Space Grotesk',fontSize:'clamp(46px,7vw,72px)',letterSpacing:'-.055em',margin:'14px 0 45px'}}>My academy.</h1>
  <section>
   <div className="sectionhead"><div><div className="eyebrow">Your learning</div><h2>Enrolled courses</h2></div></div>
   {courses.length===0?<div className="emptyAcademy"><div><h3>No enrolled courses yet.</h3><p className="muted">Your courses will appear here after access is granted.</p><Link className="btn primary" href="/courses">Browse courses</Link></div></div>:<div className="grid">{courses.map((c:any)=><article className="card" key={c.id}>
    {c.thumbnail_url&&<div role="img" aria-label={c.title} style={{display:'block',width:'100%',aspectRatio:'16/9',backgroundImage:`url(${c.thumbnail_url})`,backgroundSize:'cover',backgroundPosition:'center',borderRadius:12,marginBottom:16}}/>}
    <span className="tag">{c.category}</span><h3 style={{fontFamily:'Space Grotesk',fontSize:23}}>{c.title}</h3><p className="muted" style={{lineHeight:1.7}}>{c.description||'Practical cybersecurity training.'}</p>
    <div className="actions"><Link className="btn primary" href={`/courses/${c.slug}`}>Open course</Link></div>
   </article>)}</div>}
  </section>
  <section className="section compact" style={{paddingBottom:0}}>
   <div className="sectionhead"><div><div className="eyebrow">Your achievements</div><h2>Certificates</h2></div></div>
   {certificates.length===0?<div className="emptyAcademy"><div><h3>No certificates yet.</h3><p className="muted">Certificates you receive will appear here.</p></div></div>:<div className="grid">{certificates.map((c:any)=><article className="card" key={c.certificate_id}><span className="tag">Certificate</span><h3 style={{fontFamily:'Space Grotesk',fontSize:23}}>{c.course_title}</h3><p className="muted">Issued {new Date(c.issued_at).toLocaleDateString()}</p><div className="actions"><Link className="btn primary" href={`/certificate/${c.certificate_id}`}>View certificate</Link></div></article>)}</div>}
  </section>
 </section></div></main>;
}