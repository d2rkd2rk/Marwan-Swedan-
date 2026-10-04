'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';

const defaultWhatsAppNumber='201515227612';
function requestUrl(path:any){
 const n=path.whatsapp_number||defaultWhatsAppNumber;
 const message=`السلام عليكم، أريد شراء مسار ${path.title}.\nالسعر الحالي: ${path.price} EGP\nUsername/Email: `;
 return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
export default function Paths(){
 const [paths,setPaths]=useState<any[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{
  fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(m=>{
   if(!m.user){location.href='/login?next=/paths';return null}
   return fetch('/api/paths',{cache:'no-store'}).then(r=>r.json());
  }).then(j=>{if(j)setPaths(j.paths||[])}).catch(()=>{}).finally(()=>setLoading(false));
 },[]);
 return <main><div className="shell"><SiteNav/><section className="section">
  <div className="eyebrow">Learning Paths · Member Area</div>
  <h1 style={{fontFamily:'Space Grotesk',fontSize:'clamp(48px,7vw,78px)',letterSpacing:'-.055em',margin:'14px 0'}}>Follow a path.<br/><span style={{color:'#c084fc'}}>Build your skills.</span></h1>
  <p className="muted" style={{maxWidth:720,lineHeight:1.8}}>Structured learning journeys built from the same independent courses in the academy.</p>
  {loading?<p className="muted">Loading paths…</p>:paths.length===0?<div className="emptyAcademy"><div><h2>No paths published yet.</h2><p className="muted">New learning paths will appear here when they are published.</p></div></div>:<div className="grid" style={{marginTop:45}}>{paths.map(p=><article className="card pathCard" key={p.id}>
   {p.thumbnail_url&&<div role="img" aria-label={p.title} style={{display:'block',width:'100%',aspectRatio:'16/9',backgroundImage:`url(${p.thumbnail_url})`,backgroundSize:'cover',backgroundPosition:'center',borderRadius:14,marginBottom:18}}/>}
   <span className="tag" style={{color:'#d8b4fe'}}>{p.category}</span><h3 style={{fontFamily:'Space Grotesk',fontSize:24}}>{p.title}</h3>
   <p className="muted" style={{lineHeight:1.7}}>{p.description||'A structured learning path.'}</p>
   <p className="small muted">{p.level} · {Number(p.course_count||0)} courses · {Math.round(Number(p.duration_minutes||0)/60*10)/10} hours · {p.is_free?'Free':`${p.price} EGP`}</p>
   <div className="actions"><Link className="btn" href={`/paths/${p.slug}`}>{p.enrolled?'Open path':'View path'}</Link>{!p.is_free&&!p.enrolled&&<a className="btn primary pathAccentBtn" href={requestUrl(p)} target="_blank" rel="noreferrer">Request access</a>}</div>
  </article>)}</div>}
 </section></div></main>;
}
