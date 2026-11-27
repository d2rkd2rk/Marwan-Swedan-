'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';

type Course={id:string;title:string;student_count:number};
export default function InstructorPortal(){
 const [loading,setLoading]=useState(true);
 const [courses,setCourses]=useState<Course[]>([]);
 const [courseId,setCourseId]=useState('');
 const [title,setTitle]=useState('');
 const [file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [allowed,setAllowed]=useState(false);
 useEffect(()=>{
  (async()=>{
   try{
    const me=await fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json());
    if(me.user?.role!=='instructor'){setLoading(false);return}
    const response=await fetch('/api/instructor/uploads',{cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Could not load assigned courses.');
    setCourses(data.courses||[]);
    setCourseId(data.courses?.[0]?.id||'');
    setAllowed(true);
   }catch(e:any){setMessage(e.message||'Could not load the upload page.')}
   finally{setLoading(false)}
  })();
 },[]);
 const submit=async()=>{
  if(!courseId||!title.trim()||!file||busy)return;
  if(!file.type.startsWith('video/')){setMessage('Please select a video file.');return}
  setBusy(true);setMessage('Preparing secure upload…');
  try{
   const signed=await fetch('/api/admin/upload/presign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseId,namespace:'courses',name:file.name,type:file.type,size:file.size})});
   const signedData=await signed.json();
   if(!signed.ok)throw new Error(signedData.error||'Could not prepare upload.');
   setMessage('Uploading video…');
   await new Promise<void>((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('PUT',signedData.uploadUrl);
    xhr.setRequestHeader('Content-Type',file.type);
    xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error('Video upload failed.'));
    xhr.onerror=()=>reject(new Error('Video upload failed. Check your connection.'));
    xhr.send(file);
   });
   setMessage('Sending video for review…');
   const response=await fetch('/api/instructor/uploads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseId,title,fileUrl:signedData.url,fileName:file.name})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Could not submit video.');
   setTitle('');setFile(null);
   const picker=document.getElementById('instructor-video-file') as HTMLInputElement|null;
   if(picker)picker.value='';
   setMessage('Video submitted successfully. It will remain private until the academy administrator reviews it.');
  }catch(e:any){setMessage(e.message||'Upload failed.')}
  finally{setBusy(false)}
 };
 if(loading)return <main className="formwrap"><div className="form"><p className="muted">Loading…</p></div></main>;
 if(!allowed)return <main className="formwrap"><div className="form"><Link className="brand" href="/">PROVENRA</Link><h1>Access unavailable.</h1><p className="muted">This page is available only to approved instructors.</p><Link className="btn" href="/">Back to home</Link></div></main>;
 return <main className="formwrap"><div className="form" style={{width:'min(620px,100%)'}}>
  <Link className="brand" href="/">PROVENRA</Link>
  <div className="eyebrow" style={{marginTop:30}}>Instructor upload</div>
  <h1>Submit a course video.</h1>
  <p className="muted">Upload a video for a course assigned to you. It will not be visible to students until it is approved.</p>
  {courses.length===0?<div className="error">No courses are currently assigned to your instructor account.</div>:<>
   <div className="field"><label>Assigned course</label><select value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(course=><option key={course.id} value={course.id}>{course.title} — {Number(course.student_count||0)} students</option>)}</select>{(()=>{const selected=courses.find(course=>course.id===courseId);return selected?<span className="small muted">Active students enrolled in this course: <b style={{fontSize:18,fontWeight:800,textDecoration:'underline',textUnderlineOffset:4,textDecorationThickness:1}}>{Number(selected.student_count||0)}</b></span>:null})()}</div>
   <div className="field"><label>Video title</label><input value={title} maxLength={180} onChange={e=>setTitle(e.target.value)} placeholder="Enter the lesson title"/></div>
   <div className="field"><label>Video file</label><input id="instructor-video-file" type="file" accept="video/mp4,video/webm,video/quicktime,video/*" onChange={e=>setFile(e.target.files?.[0]||null)}/>{file&&<span className="small muted">{file.name} · {(file.size/1024/1024).toFixed(1)} MB</span>}<span className="small muted">Videos are uploaded directly to private storage. Maximum size: 5 GB.</span></div>
   <button className="btn primary" style={{width:'100%'}} disabled={busy||!courseId||!title.trim()||!file} onClick={submit}>{busy?'Uploading…':'Upload video for review'}</button>
  </>}
  {message&&<div className={message.startsWith('Video submitted')?'success':'error'} role="status">{message}</div>}
 </div></main>;
}
