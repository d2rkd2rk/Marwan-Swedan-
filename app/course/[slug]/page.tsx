'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';

const whatsappNumber='201515227612';
const suggestedQuestions=[
  'الكورس ده مناسب للمبتدئين؟',
  'هتعلم إيه من الكورس ده؟',
  'What will I learn from this course?',
  'How long is this course?',
  'What are the prerequisites?',
  'ممكن تشرحلي ترتيب الدروس؟'
];

type Progress={lesson_id:string;completed:boolean;progress_seconds:number;updated_at:string;last_viewed_at?:string|null};

export default function CoursePage({params}:{params:Promise<{slug:string}>}){
  const [slug,setSlug]=useState('');
  const [data,setData]=useState<any>(null);
  const [q,setQ]=useState('');
  const [answer,setAnswer]=useState('');
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState<Record<string,Progress>>({});
  const lastSaved=useRef<Record<string,number>>({});
  const lessonRefs=useRef<Record<string,HTMLDivElement|null>>({});
  const didRestore=useRef(false);

  useEffect(()=>{
    params.then(p=>{
      setSlug(p.slug);
      fetch(`/api/courses/${p.slug}`,{cache:'no-store'})
        .then(r=>r.json())
        .then(j=>{
          setData(j);
          if(Array.isArray(j.progress)){
            const mapped:Record<string,Progress>={};
            for(const item of j.progress)mapped[item.lesson_id]=item;
            setProgress(mapped);
          }
        });
    });
  },[params]);

  useEffect(()=>{
    if(!data?.lessons?.length||didRestore.current)return;
    const saved=Object.values(progress).sort((a,b)=>new Date(b.updated_at).getTime()-new Date(a.updated_at).getTime())[0];
    if(saved?.lesson_id&&lessonRefs.current[saved.lesson_id]){
      didRestore.current=true;
      setTimeout(()=>lessonRefs.current[saved.lesson_id]?.scrollIntoView({behavior:'smooth',block:'center'}),100);
    }
  },[data,progress]);

  const purchaseUrl=useMemo(()=>{
    if(!data?.course||data.course.is_free)return '';
    const c=data.course;
    const message=`السلام عليكم، أريد شراء كورس ${c.title}.\\nالسعر الحالي: ${c.price} EGP\\nUsername/Email: `;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  },[data]);

  const saveProgress=async(lessonId:string,seconds:number,completed=false)=>{
    const safeSeconds=Math.max(0,Math.floor(seconds||0));
    setProgress(prev=>({
      ...prev,
      [lessonId]:{
        lesson_id:lessonId,
        completed:Boolean(prev[lessonId]?.completed||completed),
        progress_seconds:safeSeconds,
        updated_at:new Date().toISOString(),
        last_viewed_at:new Date().toISOString()
      }
    }));
    try{
      await fetch(`/api/courses/${slug}/progress`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({lessonId,progressSeconds:safeSeconds,completed}),
        keepalive:true
      });
    }catch{}
  };

  const handleTimeUpdate=(lessonId:string,currentTime:number,duration:number)=>{
    const previous=lastSaved.current[lessonId]??0;
    const nearEnd=duration>0&&currentTime/duration>=0.95;
    if(currentTime-previous>=5||nearEnd){
      lastSaved.current[lessonId]=currentTime;
      saveProgress(lessonId,currentTime,nearEnd);
    }
  };

  const markComplete=(lessonId:string)=>{
    const current=progress[lessonId]?.progress_seconds||0;
    lastSaved.current[lessonId]=current;
    saveProgress(lessonId,current,true);
  };

  const ask=async(message?:string)=>{
    const question=(message??q).trim();
    if(!question||busy)return;
    setQ(question);setBusy(true);setAnswer('');
    try{
      const r=await fetch('/api/ai/course',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,question})});
      const j=await r.json();
      setAnswer(j.answer||j.error||'No answer.');
    }catch{setAnswer('AI assistant is temporarily unavailable. Please try again.')}
    finally{setBusy(false)}
  };

  if(!data)return <main><div className="shell"><SiteNav/><div className="section"><p className="muted">Loading playlist…</p></div></div></main>;
  if(data.error)return <main><div className="shell"><SiteNav/><div className="section"><div className="error">{data.error}</div><Link className="btn" href="/courses">Back to academy</Link></div></div></main>;

  const c=data.course;
  const lessons=data.lessons||[];
  const completedCount=lessons.filter((l:any)=>progress[l.id]?.completed).length;
  const percent=lessons.length?Math.round((completedCount/lessons.length)*100):0;

  return <main>
    <div className="shell">
      <SiteNav/>
      <section className="coursehero">
        <span className="tag">{c.category}</span>
        <h1>{c.title}</h1>
        <p className="muted" style={{maxWidth:800,lineHeight:1.8}}>{c.description}</p>
        <div className="chips">
          <span className="chip">{c.level}</span>
          <span className="chip">{Math.round(c.duration_minutes/60*10)/10} hours</span>
          <span className="chip">{c.is_free?'Free':`${c.price} EGP`}</span>
          <span className="chip">{data.enrolled?'Access granted':'Access pending'}</span>
        </div>
        {data.enrolled&&lessons.length>0&&<div style={{maxWidth:800,marginTop:18}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:12,marginBottom:7}}>
            <span className="small muted">Your progress</span><b>{percent}%</b>
          </div>
          <div style={{height:8,borderRadius:99,background:'rgba(255,255,255,.08)',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${percent}%`,background:'linear-gradient(90deg,#6ee7ff,#7c3aed)',transition:'width .25s ease'}}/>
          </div>
          <p className="small muted" style={{marginTop:7}}>{completedCount} of {lessons.length} lessons completed. Your progress is saved to your account.</p>
        </div>}
        {!c.is_free&&!data.enrolled&&<div className="actions"><a className="btn primary" href={purchaseUrl} target="_blank" rel="noreferrer">Buy this course on WhatsApp</a></div>}
        {c.is_free&&!data.enrolled&&<div className="actions"><Link className="btn primary" href="/register">Join for free</Link><Link className="btn" href="/login">Sign in</Link></div>}
      </section>

      <section className="section" style={{paddingTop:25}}>
        {data.enrolled?<>
          <h2>Playlist</h2>
          <div>
            {lessons.map((l:any)=>{
              const p=progress[l.id];
              return <div className="lesson" key={l.id} ref={el=>{lessonRefs.current[l.id]=el}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                    <b>{l.position}. {l.title}</b>
                    {p?.completed&&<span className="tag">Completed</span>}
                  </div>
                  <div className="small muted">{l.duration_minutes} minutes {l.file_name?'· '+l.file_name:''}</div>
                  {l.video_url&&<video
                    controls
                    preload="metadata"
                    style={{width:'100%',marginTop:14,borderRadius:12}}
                    src={l.video_url}
                    onLoadedMetadata={e=>{
                      const saved=progress[l.id]?.progress_seconds||0;
                      if(saved>0&&saved<e.currentTarget.duration-2)e.currentTarget.currentTime=saved;
                    }}
                    onTimeUpdate={e=>handleTimeUpdate(l.id,e.currentTarget.currentTime,e.currentTarget.duration)}
                    onPause={e=>saveProgress(l.id,e.currentTarget.currentTime,Boolean(p?.completed))}
                    onEnded={e=>saveProgress(l.id,e.currentTarget.duration,true)}
                  />}
                  {l.file_url&&<div className="actions"><a className="btn" href={l.file_url} target="_blank" rel="noreferrer">Open lesson file</a></div>}
                  <div className="actions">
                    <button className={p?.completed?'btn':'btn primary'} onClick={()=>markComplete(l.id)}>
                      {p?.completed?'Lesson completed':'Mark lesson complete'}
                    </button>
                    {p?.progress_seconds>0&&!p?.completed&&<span className="small muted" style={{alignSelf:'center'}}>Saved at {Math.floor(p.progress_seconds/60)}:{String(Math.floor(p.progress_seconds%60)).padStart(2,'0')}</span>}
                  </div>
                </div>
                <span className="tag">Protected</span>
              </div>;
            })}
          </div>
          <div className="ai">
            <div className="eyebrow">Course AI</div><h3>Ask me anything.</h3>
            <p className="muted">Arabic, Egyptian Arabic, or English — course questions and everyday conversation are supported.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,margin:'16px 0'}}>{suggestedQuestions.map(question=><button key={question} className="iconBtn" onClick={()=>ask(question)} disabled={busy}>{question}</button>)}</div>
            <div className="field"><textarea value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask()}}} placeholder="اسأل بالعربي أو English…"/></div>
            <button className="btn primary" onClick={()=>ask()} disabled={busy}>{busy?'Thinking…':'Ask AI'}</button>
            {answer&&<p style={{lineHeight:1.8,whiteSpace:'pre-wrap',marginTop:16}}>{answer}</p>}
          </div>
        </>:<div className="card">
          <h3>{c.is_free?'Free playlist — sign in to start.':'Ready to buy? Contact me on WhatsApp.'}</h3>
          <p className="muted">{c.is_free?'Create an account or sign in and the lessons will become available.':'The current price is shown above. Tap the WhatsApp button to send a ready-made purchase message. Payment is arranged with the instructor directly.'}</p>
          <div className="actions">{c.is_free?<><Link className="btn primary" href="/register">Register</Link><Link className="btn" href="/login">Sign in</Link></>:<a className="btn primary" href={purchaseUrl} target="_blank" rel="noreferrer">Buy this course</a>}</div>
        </div>}
      </section>
    </div>
  </main>;
}
