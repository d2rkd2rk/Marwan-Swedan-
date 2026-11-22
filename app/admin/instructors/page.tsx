'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';

type Item={id:string;name:string;email:string;username:string;role:string};
type Course={id:string;title:string;published:boolean};
type Assignment={id:string;user_id:string;course_id:string;name:string;username:string;course_title:string};
type Upload={id:string;title:string;file_url:string;file_name:string;status:string;instructor_name:string;course_title:string;course_id:string;created_at:string};
export default function InstructorsAdmin(){
 const [users,setUsers]=useState<Item[]>([]),[courses,setCourses]=useState<Course[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[uploads,setUploads]=useState<Upload[]>([]);
 const [userId,setUserId]=useState(''),[courseId,setCourseId]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[authorized,setAuthorized]=useState<boolean|null>(null);
 const load=async()=>{
  const me=await fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json());
  if(me.user?.role!=='admin'){setAuthorized(false);return}
  setAuthorized(true);
  const response=await fetch('/api/admin/instructors',{cache:'no-store'});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'Could not load instructor management.');
  setUsers(data.users||[]);setCourses(data.courses||[]);setAssignments(data.assignments||[]);setUploads(data.uploads||[]);
  setUserId(current=>current||data.users?.[0]?.id||'');setCourseId(current=>current||data.courses?.[0]?.id||'');
 };
 useEffect(()=>{load().catch(e=>setMessage(e.message||'Could not load data.'))},[]);
 const changeAccess=async(action:'assign'|'revoke',targetUser:string,targetCourse:string)=>{
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/admin/instructors',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,userId:targetUser,courseId:targetCourse})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not update instructor access.');
   setMessage(action==='assign'?'Instructor access granted.':'Course access revoked.');
   await load();
  }catch(e:any){setMessage(e.message||'Request failed.')}finally{setBusy(false)}
 };
 const review=async(action:'approve'|'reject',uploadId:string)=>{
  if(action==='reject'&&!confirm('Reject this video? It will remain unavailable to students.'))return;
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/admin/instructors',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,uploadId})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not review video.');
   setMessage(action==='approve'?'Video approved and published as a course lesson.':'Video rejected.');
   await load();
  }catch(e:any){setMessage(e.message||'Review failed.')}finally{setBusy(false)}
 };
 if(authorized===null)return <main className="shell"><section className="section"><p className="muted">Checking administrator access…</p></section></main>;
 if(!authorized)return <main className="shell"><section className="section"><div className="error">Administrator access required.</div><Link className="btn" href="/">Back</Link></section></main>;
 const pending=uploads.filter(upload=>upload.status==='pending');
 return <main><div className="shell">
  <nav className="nav"><Link className="brand" href="/">PROVENRA</Link><div className="navlinks"><Link href="/admin">Admin dashboard</Link><Link href="/admin/transactions">Transactions</Link></div><Link className="btn" href="/admin">Back to dashboard</Link></nav>
  <section className="dash">
   <div className="eyebrow">Academy access</div><div className="adminTitle"><div><h1>Instructors.</h1><p className="muted">Assign course access and review every submitted video before it goes live.</p></div></div>
   {message&&<div className="success" role="status">{message}</div>}
   <div className="card">
    <div className="cardHead"><div><div className="eyebrow">Access control</div><h3>Assign an instructor</h3></div></div>
    <div className="grid">
     <div className="field"><label>Account</label><select value={userId} onChange={e=>setUserId(e.target.value)}><option value="">Choose account</option>{users.map(user=><option key={user.id} value={user.id}>{user.name} · @{user.username} · {user.role}</option>)}</select></div>
     <div className="field"><label>Course</label><select value={courseId} onChange={e=>setCourseId(e.target.value)}><option value="">Choose course</option>{courses.map(course=><option key={course.id} value={course.id}>{course.title}</option>)}</select></div>
    </div>
    <button className="btn primary" disabled={busy||!userId||!courseId} onClick={()=>changeAccess('assign',userId,courseId)}>Grant instructor access</button>
   </div>
   <div className="card">
    <div className="cardHead"><div><div className="eyebrow">Current permissions</div><h3>Assigned instructors</h3></div><span className="statusPill">{assignments.length} assignments</span></div>
    {assignments.length===0?<p className="muted">No instructors assigned yet.</p>:<div className="lessonList">{assignments.map(item=><div className="lessonRow" key={item.id}><div className="lessonInfo"><b>{item.name} · @{item.username}</b><small>{item.course_title}</small></div><button className="btn" disabled={busy} onClick={()=>changeAccess('revoke',item.user_id,item.course_id)}>Revoke</button></div>)}</div>}
   </div>
   <div className="card">
    <div className="cardHead"><div><div className="eyebrow">Video approval</div><h3>Pending submissions</h3></div><span className="statusPill">{pending.length} pending</span></div>
    {pending.length===0?<p className="muted">No videos are waiting for review.</p>:<div className="lessonList">{pending.map(upload=><article key={upload.id} className="card" style={{marginBottom:14}}>
      <div className="cardHead"><div><b>{upload.title}</b><p className="small muted">{upload.instructor_name} · {upload.course_title} · {upload.file_name}</p></div><span className="statusPill">Pending</span></div>
      <video controls preload="metadata" src={upload.file_url} style={{width:'100%',maxHeight:420,background:'#000',borderRadius:12}}/>
      <div className="actions" style={{marginTop:14}}><button className="btn primary" disabled={busy} onClick={()=>review('approve',upload.id)}>Approve & publish</button><button className="btn" disabled={busy} onClick={()=>review('reject',upload.id)}>Reject</button></div>
     </article>)}</div>}
   </div>
   <div className="card">
    <div className="cardHead"><div><div className="eyebrow">Review history</div><h3>Previously reviewed</h3></div></div>
    {uploads.filter(upload=>upload.status!=='pending').length===0?<p className="muted">No reviewed videos yet.</p>:<div className="lessonList">{uploads.filter(upload=>upload.status!=='pending').map(upload=><div className="lessonRow" key={upload.id}><div className="lessonInfo"><b>{upload.title}</b><small>{upload.instructor_name} · {upload.course_title}</small></div><span className="statusPill">{upload.status}</span></div>)}</div>}
   </div>
  </section>
 </div></main>;
}
