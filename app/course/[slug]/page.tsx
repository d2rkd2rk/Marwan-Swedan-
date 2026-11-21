/* production deployment trigger */
'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
import AdUnit from '@/app/components/AdUnit';
import VideoPlayer from '@/app/components/VideoPlayer';

const suggestedQuestions=[
  'الكورس ده مناسب للمبتدئين؟',
  'هتعلم إيه من الكورس ده؟',
  'What will I learn from this course?',
  'How long is this course?',
  'What are the prerequisites?',
  'ممكن تشرحلي ترتيب الدروس؟'
];

type Progress={lesson_id:string;completed:boolean;progress_seconds:number;updated_at:string;last_viewed_at?:string|null;watched_seconds?:number;watch_percent?:number};

export default function CoursePage({params}:{params:Promise<{slug:string}>}){
  const [slug,setSlug]=useState('');
  const [data,setData]=useState<any>(null);
  const [q,setQ]=useState('');
  const [answer,setAnswer]=useState('');
  const [busy,setBusy]=useState(false);
  const [openVideos,setOpenVideos]=useState<Record<string,boolean>>({});
  const [progress,setProgress]=useState<Record<string,Progress>>({});
  const [watchSyncError,setWatchSyncError]=useState<Record<string,string>>({});
  const [certificate,setCertificate]=useState<{certificateId:string;issuedAt:string}|null>(null);
  const [reviews,setReviews]=useState<any[]>([]);
  const [myReview,setMyReview]=useState<any>(null);
  const [reviewRating,setReviewRating]=useState(0);
  const [reviewText,setReviewText]=useState('');
  const [reviewBusy,setReviewBusy]=useState(false);
  const [reviewMessage,setReviewMessage]=useState('');
  const [reviewModalOpen,setReviewModalOpen]=useState(false);
  const [enrollBusy,setEnrollBusy]=useState(false);
  const [enrollMessage,setEnrollMessage]=useState('');
  const [couponCode,setCouponCode]=useState('');
  const [couponInfo,setCouponInfo]=useState<any>(null);
  const [couponMessage,setCouponMessage]=useState('');
  const [couponBusy,setCouponBusy]=useState(false);
  const [couponRequestBusy,setCouponRequestBusy]=useState(false);
  const [isReviewAdmin,setIsReviewAdmin]=useState(false);
  const lastSaved=useRef<Record<string,number>>({});
  const watchSessions=useRef<Record<string,string>>({});
  const watchHeartbeatInFlight=useRef<Record<string,boolean>>({});
  const watchRetryAfter=useRef<Record<string,number>>({});
  const lessonRefs=useRef<Record<string,HTMLDivElement|null>>({});

  useEffect(()=>{
    if(!slug)return;
    fetch(`/api/courses/${slug}/reviews`,{cache:'no-store'}).then(r=>r.json()).then(j=>{
      if(Array.isArray(j.reviews))setReviews(j.reviews);
      setIsReviewAdmin(Boolean(j.isAdmin));
      if(j.myReview){setMyReview(j.myReview);setReviewRating(j.myReview.rating);setReviewText(j.myReview.review||'');}
    }).catch(()=>{});
  },[slug]);

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


  const purchaseUrl=useMemo(()=>data?.course&&!data.course.is_free?'/payment/'+data.course.slug:'',[data]);

  const applyCoupon=async()=>{
    if(!couponCode.trim()||couponBusy)return;
    setCouponBusy(true);setCouponMessage('');setCouponInfo(null);
    try{
      const response=await fetch('/api/coupons/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,code:couponCode})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Could not apply coupon.');
      setCouponInfo(result);setCouponMessage('Coupon applied successfully.');
    }catch(error:any){setCouponMessage(error.message||'Could not apply coupon.');}
    finally{setCouponBusy(false);}
  };
  const requestWithCoupon=async()=>{
    if(!couponInfo||couponRequestBusy)return;
    setCouponRequestBusy(true);
    window.location.assign('/payment/'+slug+'?coupon='+encodeURIComponent(couponInfo.code));
  };

  const saveProgress=async(lessonId:string,seconds:number,completed=false)=>{
    const safeSeconds=Math.max(0,Math.floor(seconds||0));
    setProgress(prev=>({
      ...prev,
      [lessonId]:{
        ...prev[lessonId],
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

  const handleTimeUpdate=(lessonId:string,currentTime:number,duration:number,playbackRate:number)=>{
    const previous=lastSaved.current[lessonId]??0;
    const firstUpdate=!(lessonId in lastSaved.current);
    const movedBack=currentTime<previous-2;
    const heartbeatInterval=Math.max(1,duration*0.01);
    if(!(firstUpdate||currentTime-previous>=heartbeatInterval||movedBack))return;
    if(watchHeartbeatInFlight.current[lessonId]||Date.now()<(watchRetryAfter.current[lessonId]||0))return;

    const sessionId=watchSessions.current[lessonId]||(watchSessions.current[lessonId]=typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():String(Date.now())+'-'+String(Math.random()));
    watchHeartbeatInFlight.current[lessonId]=true;
    fetch(`/api/courses/${slug}/progress`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({eventType:'heartbeat',lessonId,currentTime,duration,playbackRate,sessionId}),
      keepalive:true
    }).then(async response=>{
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||`Watch progress request failed (${response.status}).`);
      if(!result.watchProgress)throw new Error('The server did not return verified watch progress.');
      lastSaved.current[lessonId]=currentTime;
      watchRetryAfter.current[lessonId]=0;
      setWatchSyncError(prev=>({...prev,[lessonId]:''}));
      setProgress(prev=>{
        const current=prev[lessonId]||{lesson_id:lessonId,completed:false,progress_seconds:0,updated_at:new Date().toISOString()};
        const watchedSeconds=Math.max(current.watched_seconds||0,Number(result.watchProgress.watchedSeconds)||0);
        const watchPercent=Math.max(current.watch_percent||0,Number(result.watchProgress.percent)||0);
        return {...prev,[lessonId]:{...current,watched_seconds:watchedSeconds,watch_percent:watchPercent}};
      });
    }).catch(error=>{
      watchRetryAfter.current[lessonId]=Date.now()+1500;
      setWatchSyncError(prev=>({...prev,[lessonId]:error instanceof Error?error.message:'Could not sync watch progress. Retrying…'}));
    }).finally(()=>{
      watchHeartbeatInFlight.current[lessonId]=false;
    });
    setProgress(prev=>({
      ...prev,
      [lessonId]:{
        ...prev[lessonId],lesson_id:lessonId,completed:Boolean(prev[lessonId]?.completed),
        progress_seconds:Math.floor(currentTime),updated_at:new Date().toISOString(),last_viewed_at:new Date().toISOString()
      }
    }));
  };

  const markComplete=async(lessonId:string)=>{
    if(!slug)return;
    const current=progress[lessonId]?.progress_seconds||0;
    try{
      const response=await fetch(`/api/courses/${slug}/progress`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({lessonId,progressSeconds:current,completed:true}),
        cache:'no-store'
      });
      const result=await response.json();
      if(!response.ok||!result.progress?.completed)throw new Error(result.error||'Could not save completion');
      setProgress(prev=>({...prev,[lessonId]:result.progress}));
    }catch{
      // Keep the previous state when the database did not confirm completion.
    }
  };

  const submitReview=async()=>{
    if(reviewBusy||reviewRating<1||reviewRating>5||reviewText.trim().length<5)return;
    setReviewBusy(true);setReviewMessage('');
    try{
      const r=await fetch(`/api/courses/${slug}/reviews`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rating:reviewRating,review:reviewText})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Could not save review.');
      setMyReview(j.review);setReviewMessage('Review saved.');
      const refreshed=await fetch(`/api/courses/${slug}/reviews`,{cache:'no-store'}).then(x=>x.json());
      setReviews(refreshed.reviews||[]);
      if(courseComplete&&!data.certificateBlockedByPath){
        const certificateResponse=await fetch(`/api/courses/${slug}/certificate`,{cache:'no-store'});
        const certificateResult=await certificateResponse.json();
        if(certificateResponse.ok&&certificateResult.certificateId){
          setCertificate({certificateId:certificateResult.certificateId,issuedAt:certificateResult.issuedAt});
          setReviewModalOpen(false);
          setReviewMessage('Review saved. Your certificate is ready.');
        }else{
          setReviewMessage(certificateResult.error||'Review saved, but the certificate could not be issued yet.');
        }
      }
    }catch(e:any){setReviewMessage(e.message||'Could not save review.');}
    finally{setReviewBusy(false);}
  };
  const openCourseReviewModal=()=>{
    setReviewMessage('');
    if(myReview){claimCourseCertificate();return;}
    setReviewModalOpen(true);
  };
  const claimCourseCertificate=async()=>{
    if(!courseComplete||data.certificateBlockedByPath)return;
    setReviewBusy(true);setReviewMessage('');
    try{
      const response=await fetch(`/api/courses/${slug}/certificate`,{cache:'no-store'});
      const result=await response.json();
      if(!response.ok||!result.certificateId)throw new Error(result.error|| (result.needsReview?'Submit your review first.':'The certificate could not be issued.'));
      setCertificate({certificateId:result.certificateId,issuedAt:result.issuedAt});
      setReviewMessage('Your certificate is ready.');
    }catch(e:any){setReviewMessage(e.message||'Could not issue certificate.');}
    finally{setReviewBusy(false);}
  };
  const deleteReview=async(id:string)=>{
    if(!isReviewAdmin||!confirm('Delete this review?'))return;
    try{
      const r=await fetch(`/api/courses/${slug}/reviews`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Could not delete review.');
      setReviews(prev=>prev.filter(x=>x.id!==id));
    }catch(e:any){setReviewMessage(e.message||'Could not delete review.');}
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
            <div style={{height:'100%',width:`${percent}%`,background:'linear-gradient(90deg,#c6a66a,#e0c98f)',transition:'width .25s ease'}}/>
          </div>
          <p className="small muted" style={{marginTop:7}}>{completedCount} of {lessons.length} lessons completed. {courseComplete?'Course complete.':'Finish every video to complete the course.'} Your progress is saved to your account.</p>
          {data.certificateBlockedByPath?<div className="certificateUnlock"><div><div className="eyebrow">Path certificate only</div><h3>Course certificate unavailable inside this path.</h3><p className="small muted">Complete the full learning path to receive its path certificate. Course certificates are reserved for courses taken independently.</p></div></div>:courseComplete&&certificate?<div className="certificateUnlock"><div><div className="eyebrow">Achievement unlocked</div><h3>🎓 Your certificate is ready.</h3><p className="small muted">You completed 100% of <b>{c.title}</b>. Your certificate uses your full name exactly as saved on your account.</p></div><div className="actions"><Link className="btn primary" href={`/certificate/${certificate.certificateId}`}>View certificate</Link><a className="btn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${typeof window!=='undefined'?window.location.origin:'https://marwan-swedan.vercel.app'}/certificate/${certificate.certificateId}`)}`} target="_blank" rel="noreferrer">in&nbsp; Share on LinkedIn ↗</a></div></div>:courseComplete?<div style={{marginTop:16,padding:18,borderRadius:16,border:'1px solid rgba(198,166,106,.28)',background:'rgba(255,255,255,.03)'}}><div style={{fontSize:13,letterSpacing:'.08em',textTransform:'uppercase'}}>🎓 Certificate</div><h3 style={{margin:'8px 0 6px'}}>Your certificate is ready to claim.</h3><p className="small muted" style={{margin:0}}>To receive it, submit a rating and a review of at least 5 characters. We’ll take you to the review section.</p><button type="button" className="btn primary" style={{marginTop:14}} onClick={openCourseReviewModal}>Claim certificate</button></div>:<div style={{marginTop:16,padding:18,borderRadius:16,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.03)',opacity:.72}}><div style={{fontSize:13,letterSpacing:'.08em',textTransform:'uppercase'}}>🔒 Certificate locked</div><h3 style={{margin:'8px 0 6px'}}>Complete the course to unlock your certificate.</h3><p className="small muted" style={{margin:0}}>Finish all {lessons.length} lessons. Once every lesson is marked <b>Completed</b>, you can claim your certificate after submitting a review.</p></div>}
        </div>}
        {!c.is_free&&!data.enrolled&&<div style={{maxWidth:520,marginTop:20}}>
          <div className="field"><label htmlFor="course-coupon">Have a discount code?</label><div className="actions" style={{alignItems:'stretch'}}><input id="course-coupon" value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setCouponInfo(null);setCouponMessage('')}} placeholder="Enter coupon code" maxLength={40} style={{flex:1,minWidth:180}}/><button className="btn" type="button" disabled={!couponCode.trim()||couponBusy} onClick={applyCoupon}>{couponBusy?'Checking…':'Apply code'}</button></div></div>
          {couponInfo&&<div className="card" style={{marginTop:12,padding:16}}><div className="eyebrow">Discount applied · {couponInfo.code}</div><div className="small muted" style={{textDecoration:'line-through'}}>Original price: {Number(couponInfo.originalPrice).toFixed(2)} EGP</div><p style={{margin:'6px 0'}}>Discount: <b>{Number(couponInfo.discountAmount).toFixed(2)} EGP</b></p><h3 style={{margin:'6px 0 14px'}}>Final price: {Number(couponInfo.finalPrice).toFixed(2)} EGP</h3><button className="btn primary" disabled={couponRequestBusy} onClick={requestWithCoupon}>{couponRequestBusy?'Opening checkout…':'Continue to InstaPay payment'}</button></div>}
          {couponMessage&&<p className="small muted" role="status">{couponMessage}</p>}
          {!couponInfo&&<div className="actions"><a className="btn primary" href={purchaseUrl}>Continue to InstaPay payment</a></div>}
        </div>}
        {c.is_free&&!data.enrolled&&<div className="actions"><button className="btn primary" disabled={enrollBusy} onClick={async()=>{setEnrollBusy(true);setEnrollMessage('');try{const r=await fetch(`/api/courses/${slug}`,{method:'POST'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Enrollment failed');const refreshed=await fetch(`/api/courses/${slug}`,{cache:'no-store'}).then(x=>x.json());setData(refreshed);if(Array.isArray(refreshed.progress)){const mapped:Record<string,Progress>={};for(const item of refreshed.progress)mapped[item.lesson_id]=item;setProgress(mapped)}}catch(e:any){setEnrollMessage(e.message||'Could not enroll.')}finally{setEnrollBusy(false)}}}>{enrollBusy?'Enrolling…':'Enroll for free'}</button><Link className="btn" href="/login">Sign in</Link>{enrollMessage&&<p className="small muted">{enrollMessage}</p>}</div>}
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
                      <div style={{height:'100%',width:`${Math.min(100,Math.max(0,((p?.progress_seconds||0)/Math.max(1,(l.duration_minutes||0)*60))*100))}%`,background:'linear-gradient(90deg,#c6a66a,#e0c98f)',transition:'width .15s ease'}}/>
                    </div>
                    <VideoPlayer
                      src={lessonVideoUrl}
                      savedSeconds={progress[l.id]?.progress_seconds||0}
                      onTimeUpdate={(currentTime,duration,playbackRate)=>handleTimeUpdate(l.id,currentTime,duration,playbackRate)}
                      onPause={currentTime=>saveProgress(l.id,currentTime,Boolean(p?.completed))}
                      onEnded={duration=>saveProgress(l.id,duration,false)}
                    />
                    <div className="small muted" style={{marginTop:7}}>
                      {p?.completed?'✓ Video completed':'Mark the video as completed when you finish watching.'}
                    </div>
                  </div>}
                  {l.file_url&&<div className="actions"><a className="btn" href={isVideoFile(l.file_url,l.file_name||'')?('#lesson-video-'+l.id):l.file_url} target={isVideoFile(l.file_url,l.file_name||'')?undefined:'_blank'} rel={isVideoFile(l.file_url,l.file_name||'')?undefined:'noreferrer'} onClick={e=>{if(isVideoFile(l.file_url,l.file_name||'')){e.preventDefault();setOpenVideos(v=>({...v,[l.id]:true}));window.setTimeout(()=>document.getElementById('lesson-video-'+l.id)?.scrollIntoView({behavior:'smooth',block:'center'}),0);}}}>Open lesson file</a></div>}
                  <div className="actions">
                    <button className={p?.completed?'btn':'btn primary'} onClick={()=>markComplete(l.id)} disabled={p?.completed||(Boolean(lessonVideoUrl)&&(p?.watch_percent||0)<70)}>
                      {p?.completed?'Lesson completed':Boolean(lessonVideoUrl)&&(p?.watch_percent||0)<70?'Watch 70% to unlock':'Mark as Completed'}
                    </button>
                    {Boolean(lessonVideoUrl)&&watchSyncError[l.id]&&<div className="small" role="status" style={{color:'#fca5a5',marginTop:7}}>{watchSyncError[l.id]}</div>}
                    {Boolean(lessonVideoUrl)&&!p?.completed&&<div style={{width:'100%',maxWidth:420,marginTop:8}}>
                      <div className="small muted" style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                        <span>Watched {p?.watch_percent||0}% of video</span>
                        <span>{Math.min(100,Math.floor((p?.watch_percent||0)/70*100))}% of 70% requirement</span>
                      </div>
                      <div style={{height:6,borderRadius:99,background:'rgba(255,255,255,.08)',overflow:'hidden',marginTop:7}}>
                        <div style={{height:'100%',width:`${Math.min(100,((p?.watch_percent||0)/70)*100)}%`,background:'linear-gradient(90deg,#c6a66a,#e0c98f)',transition:'width .25s ease'}}/>
                      </div>
                    </div>}
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
          <h3>{c.is_free?'Free playlist — sign in to start.':'Ready to enroll? Pay securely with InstaPay.'}</h3>
          <p className="muted">{c.is_free?'Create an account or sign in and the lessons will become available.':'The current price is shown above. Continue to the InstaPay payment page, upload your receipt, and track the review from your dashboard.'}</p>
          <div className="actions">{c.is_free?<><Link className="btn primary" href="/register">Register</Link><Link className="btn" href="/login">Sign in</Link></>:<a className="btn primary" href={purchaseUrl}>Continue to InstaPay payment</a>}</div>
        </div>}
      </section>
      <AdUnit slot="8990444362" />

      <section id="course-reviews" className="section courseReviews" style={{paddingTop:25}}>
        <div className="sectionhead"><div><div className="eyebrow">Student feedback</div><h2>Reviews & Ratings</h2></div><span className="small muted">{reviews.length} review{reviews.length===1?'':'s'}</span></div>
        {data.enrolled&&<div className="card" style={{marginBottom:20}}>
          <div className="cardHead"><div><h3>{myReview?'Edit your review':'Rate this course'}</h3><p className="small muted">Share your experience with other students.</p></div></div>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:14}}>{[1,2,3,4,5].map(n=><button key={n} type="button" className="iconBtn" aria-label={`Rate ${n} out of 5`} onClick={()=>setReviewRating(n)} style={{fontSize:22,padding:'4px 9px',color:n<=reviewRating?'#f3c969':'#66798a',borderColor:n<=reviewRating?'#8a7540':'var(--line)'}}><span style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,lineHeight:1}}><span style={{fontSize:12,fontWeight:700}}>{n}</span><span>★</span></span></button>)}</div>
          <div className="field"><label>Your review</label><textarea maxLength={1000} value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Write your review about this course…"/><span className="small muted">At least 5 characters required.</span></div>
          <div className="actions"><button className="btn primary" onClick={submitReview} disabled={reviewBusy||reviewRating<1||reviewText.trim().length<5}>{reviewBusy?'Saving…':myReview?'Update review':'Publish review'}</button>{courseComplete&&myReview&&!certificate&&!data.certificateBlockedByPath&&<button type="button" className="btn" onClick={claimCourseCertificate} disabled={reviewBusy}>{reviewBusy?'Preparing…':'Get my certificate'}</button>}{reviewMessage&&<span className="small muted" style={{alignSelf:'center'}}>{reviewMessage}</span>}</div>
        </div>}
        {!data.enrolled&&<div className="card" style={{marginBottom:20}}><p className="muted" style={{margin:0}}>Reviews are visible to everyone. Get course access to write your own review.</p></div>}
        {reviews.length===0?<div className="emptyAcademy"><div><h3>No reviews yet.</h3><p className="muted">Be the first student to share your experience.</p></div></div>:<div style={{display:'grid',gap:12}}>{reviews.map((r:any)=><article className="card" key={r.id}>
          <div style={{display:'flex',gap:13,alignItems:'center'}}>{r.avatar_url?<img src={r.avatar_url} alt="" style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',border:'1px solid var(--line)'}}/>:<div style={{width:44,height:44,borderRadius:'50%',background:'var(--soft)',display:'grid',placeItems:'center',fontFamily:'Space Grotesk',fontWeight:700}}>{String(r.name||'?').slice(0,1).toUpperCase()}</div>}<div><b>{r.name}</b><div className="small muted">@{r.username}</div></div><div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:12}}><span style={{color:'#f3c969',letterSpacing:2}}>{'★'.repeat(Math.max(0,Math.min(5,Number(r.rating))))}</span>{isReviewAdmin&&<button type="button" className="btn" onClick={()=>deleteReview(r.id)}>Delete</button>}</div></div>
          <p style={{lineHeight:1.8,margin:'16px 0 0',whiteSpace:'pre-wrap'}}>{r.review}</p>
        </article>)}</div>}
      </section>
    </div>
    {reviewModalOpen&&<div role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setReviewModalOpen(false)}} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.78)',display:'grid',placeItems:'center',padding:18}}>
      <section role="dialog" aria-modal="true" aria-labelledby="course-review-modal-title" className="card" style={{width:'min(100%,560px)',maxHeight:'90vh',overflowY:'auto',padding:24,background:'var(--panel,#101c2b)',border:'1px solid var(--line)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><div className="eyebrow">Certificate requirement</div><h2 id="course-review-modal-title" style={{margin:'6px 0'}}>Rate this course</h2></div><button type="button" className="iconBtn" aria-label="Close review dialog" onClick={()=>setReviewModalOpen(false)}>✕</button></div>
        <p className="small muted">Choose a rating and write at least 5 characters. Your certificate will open after your review is submitted.</p>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',margin:'18px 0'}}>{[1,2,3,4,5].map(n=><button key={n} type="button" className="iconBtn" aria-label={`Rate ${n} out of 5`} onClick={()=>setReviewRating(n)} style={{fontSize:22,padding:'4px 9px',color:n<=reviewRating?'#f3c969':'#66798a',borderColor:n<=reviewRating?'#8a7540':'var(--line)'}}>★</button>)}</div>
        <div className="field"><label htmlFor="course-certificate-review">Your review</label><textarea id="course-certificate-review" maxLength={1000} value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Write at least 5 characters about this course…"/><span className="small muted">{reviewText.trim().length}/5 minimum characters</span></div>
        {reviewMessage&&<p className="small muted" role="status">{reviewMessage}</p>}
        <div className="actions" style={{marginTop:16}}><button type="button" className="btn primary" onClick={submitReview} disabled={reviewBusy||reviewRating<1||reviewText.trim().length<5}>{reviewBusy?'Submitting…':'Submit review & get certificate'}</button><button type="button" className="btn" onClick={()=>setReviewModalOpen(false)} disabled={reviewBusy}>Cancel</button></div>
      </section>
    </div>}
  </main>;
}
