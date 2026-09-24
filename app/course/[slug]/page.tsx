/* production deployment trigger */
'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import VideoPlayer from '@/app/components/VideoPlayer';

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
  const [openVideos,setOpenVideos]=useState<Record<string,boolean>>({});
  const [progress,setProgress]=useState<Record<string,Progress>>({});
  const [certificate,setCertificate]=useState<{certificateId:string;issuedAt:string}|null>(null);
  const lastSaved=useRef<Record<string,number>>({});
  const lessonRefs=useRef<Record<string,HTMLDivElement|null>>({});

  useEffect(()=>{
    if(!data?.course?.slug||!data?.lessons?.length)return;
    const done=data.lessons.every((l:any)=>progress[l.id]?.completed);
    if(!done)return;
    fetch(`/api/courses/${data.course.slug}/certificate`,{cache:'no-store'}).then(r=>r.json()).then(j=>{if(j.certificateId)setCertificate({certificateId:j.certificateId,issuedAt:j.issuedAt})}).catch(()=>{});
  },[data,progress]);

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
    const nearEnd=duration>0&&currentTime/duration>=0.9;
    if(currentTime-previous>=5||nearEnd){
      lastSaved.current[lessonId]=currentTime;
      saveProgress(lessonId,currentTime,nearEnd);
    }
  };

  const markComplete=(lessonId:string)=>{
    const current=progress[lessonId]?.progress_seconds||0;
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
  const isVideoFile=(url:string='',name:string='')=>/\.(mp4|webm|ogg|mov|m4v)(?:[?#]|$)/i.test(url)||/\.(mp4|webm|ogg|mov|m4v)$/i.test(name);
  const completedCount=lessons.filter((l:any)=>progress[l.id]?.completed).length;
  const percent=lessons.length?Math.round((completedCount/lessons.length)*100):0;
  const courseComplete=lessons.length>0&&completedCount===lessons.length;

  return <main>
    <div className="shell">
      <SiteNav/>
      <section className="coursehero">
        {c.thumbnail_url&&<div role="img" aria-label={c.title} style={{display:'block',width:'100%',maxWidth:900,aspectRatio:'16/9',backgroundImage:`url(${c.thumbnail_url})`,backgroundSize:'cover',backgroundPosition:'center',borderRadius:18,marginBottom:24}}/>}
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
          <p className="small muted" style={{marginTop:7}}>{completedCount} of {lessons.length} lessons completed. {courseComplete?'Course complete.':'Finish every video to complete the course.'} Your progress is saved to your account.</p>
          {courseComplete&&certificate?<div className="certificateUnlock"><div><div className="eyebrow">Achievement unlocked</div><h3>🎓 Your certificate is ready.</h3><p className="small muted">You completed 100% of <b>{c.title}</b>. Your certificate uses your full name exactly as saved on your account.</p></div><div className="actions"><Link className="btn primary" href={`/certificate/${certificate.certificateId}`}>View certificate</Link><a className="btn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${typeof window!=='undefined'?window.location.origin:'https://marwan-swedan.vercel.app'}/certificate/${certificate.certificateId}`)}`} target="_blank" rel="noreferrer">in&nbsp; Share on LinkedIn ↗</a></div></div>:<div style={{marginTop:16,padding:18,borderRadius:16,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.03)',opacity:.72}}><div style={{fontSize:13,letterSpacing:'.08em',textTransform:'uppercase'}}>🔒 Certificate locked</div><h3 style={{margin:'8px 0 6px'}}>Complete the course to unlock your certificate.</h3><p className="small muted" style={{margin:0}}>Finish all {lessons.length} lessons. Once every lesson is marked <b>Completed</b>, your certificate will become available automatically.</p></div>}
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
              const lessonVideoUrl=l.video_url||((l.file_url&&isVideoFile(l.file_url,l.file_name||''))?l.file_url:'');
              return <div className="lesson" key={l.id} ref={el=>{lessonRefs.current[l.id]=el}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                    <b>{l.position}. {l.title}</b>
                    {p?.completed&&<span className="tag">Completed</span>}
                  </div>
                  <div className="small muted">{l.duration_minutes} minutes {l.file_name?'· '+l.file_name:''}</div>
                  {lessonVideoUrl&&openVideos[l.id]&&<div id={`lesson-video-${l.id}`} style={{marginTop:14}}>
                    <div style={{height:6,borderRadius:99,background:'rgba(255,255,255,.08)',overflow:'hidden',marginBottom:10}} aria-label="Video progress">
                      <div style={{height:'100%',width:`${Math.min(100,Math.max(0,((p?.progress_seconds||0)/Math.max(1,(l.duration_minutes||0)*60))*100))}%`,background:'linear-gradient(90deg,#6ee7ff,#7c3aed)',transition:'width .15s ease'}}/>
                    </div>
                    <VideoPlayer
                      src={lessonVideoUrl}
                      savedSeconds={progress[l.id]?.progress_seconds||0}
                      onTimeUpdate={(currentTime,duration)=>handleTimeUpdate(l.id,currentTime,duration)}
                      onPause={currentTime=>saveProgress(l.id,currentTime,Boolean(p?.completed))}
                      onEnded={duration=>saveProgress(l.id,duration,true)}
                    />
                    <div className="small muted" style={{marginTop:7}}>
                      {p?.completed?'✓ Video completed':'Mark the video as completed when you finish watching.'}
                    </div>
                  </div>}
                  {l.file_url&&<div className="actions"><a className="btn" href={isVideoFile(l.file_url,l.file_name||'')?('#lesson-video-'+l.id):l.file_url} target={isVideoFile(l.file_url,l.file_name||'')?undefined:'_blank'} rel={isVideoFile(l.file_url,l.file_name||'')?undefined:'noreferrer'} onClick={e=>{if(isVideoFile(l.file_url,l.file_name||'')){e.preventDefault();setOpenVideos(v=>({...v,[l.id]:true}));window.setTimeout(()=>document.getElementById('lesson-video-'+l.id)?.scrollIntoView({behavior:'smooth',block:'center'}),0);}}}>Open lesson file</a></div>}
                  <div className="actions">
                    <button className={p?.completed?'btn':'btn primary'} onClick={()=>markComplete(l.id)} disabled={p?.completed}>
                      {p?.completed?'Lesson completed':'Mark as Completed'}
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
