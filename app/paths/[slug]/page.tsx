'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';

export default function PathPage({params}:{params:Promise<{slug:string}>}){
 const [slug,setSlug]=useState(''),[data,setData]=useState<any>(null);
 useEffect(()=>{params.then(p=>{setSlug(p.slug);fetch(`/api/paths/${p.slug}`,{cache:'no-store'}).then(r=>r.json()).then(setData).catch(()=>{})})},[params]);
 if(!data)return <main><div className="shell"><SiteNav/><section className="section"><p className="muted">Loading path…</p></section></div></main>;
 if(data.error)return <main><div className="shell"><SiteNav/><section className="section"><div className="error">{data.error}</div><Link className="btn" href="/paths">Back to paths</Link></section></div></main>;
 useEffect(()=>{if(!data?.complete||data?.certificate)return;fetch(`/api/paths/${slug}/certificate`,{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.certificateId)setData((x:any)=>({...x,certificate:j}))}).catch(()=>{})},[data?.complete,data?.certificate,slug]);
 const p=data.path,courses=data.courses||[];
 const requestUrl=(()=>{const n=p.whatsapp_number||'201515227612';const m=`السلام عليكم، أريد شراء مسار ${p.title}.\nالسعر الحالي: ${p.price} EGP\nUsername/Email: `;return `https://wa.me/${n}?text=${encodeURIComponent(m)}`})();
 return <main><div className="shell"><SiteNav/><section className="coursehero pathHero">
  {p.thumbnail_url&&<div role="img" aria-label={p.title} style={{display:'block',width:'100%',maxWidth:900,aspectRatio:'16/9',backgroundImage:`url(${p.thumbnail_url})`,backgroundSize:'cover',backgroundPosition:'center',borderRadius:18,marginBottom:24}}/>}
  <span className="tag" style={{color:'#d8b4fe'}}>Learning Path</span><h1>{p.title}</h1><p className="muted" style={{maxWidth:800,lineHeight:1.8}}>{p.description}</p>
  <div className="chips"><span className="chip">{p.category}</span><span className="chip">{p.level}</span><span className="chip">{courses.length} courses</span><span className="chip">{Math.round(courses.reduce((s:any,c:any)=>s+Number(c.duration_minutes||0),0)/60*10)/10} hours</span><span className="chip">{data.enrolled?'Access granted':p.is_free?'Free path':'Access pending'}</span></div>
  {!data.enrolled&&!p.is_free&&<div className="actions" style={{marginTop:18}}><a className="btn primary pathAccentBtn" href={requestUrl} target="_blank" rel="noreferrer">Request access</a></div>}
  {data.enrolled&&<div className="pathProgressCard"><div><div className="eyebrow">Path progress</div><h3>{courses.filter((c:any)=>c.progress===100).length} of {courses.length} courses completed</h3></div><div className="pathProgressBar"><div style={{width:`${courses.length?Math.round(courses.reduce((s:any,c:any)=>s+c.progress,0)/courses.length):0}%`}}/></div></div>}
  <div className="section compact"><div className="sectionhead"><div><div className="eyebrow">Your journey</div><h2>Courses in this path</h2></div></div>
   <div className="pathCourseList">{courses.map((c:any)=><article className="pathCourseRow" key={c.course_id}><div className="pathCourseNumber">{c.position}</div><div className="pathCourseInfo"><h3>{c.title}</h3><p className="muted">{c.description||'Course in this learning path.'}</p><span className="small muted">{Math.round(Number(c.duration_minutes||0)/60*10)/10} hours · {c.progress}% complete</span></div><div>{c.accessible?<Link className="btn primary pathAccentBtn" href={`/courses/${c.slug}`}>{c.progress===100?'Review course':'Open course'}</Link>:<span className="btn" style={{opacity:.5}}>Locked</span>}</div></article>)}</div>
  </div>
  {data.complete&&data.certificate?.certificateId&&<div className="certificateUnlock pathCertificateUnlock"><div><div className="eyebrow">Achievement unlocked</div><h3>Your Path Certificate is ready.</h3><p className="small muted">You completed every course in <b>{p.title}</b>.</p></div><Link className="btn primary pathAccentBtn" href={`/path-certificate/${data.certificate.certificateId}`}>View certificate</Link></div>}
 </section></div></main>;
}
