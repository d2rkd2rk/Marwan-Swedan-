'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type Path=any; type Course=any; type Enrollment=any;
const emptyPath={title:'',slug:'',description:'',category:'Cybersecurity',level:'Beginner',thumbnailUrl:'',isFree:true,price:0,published:false,whatsappNumber:''};

export default function PathsAdmin(){
 const [me,setMe]=useState<any>(null),[paths,setPaths]=useState<Path[]>([]),[courses,setCourses]=useState<Course[]>([]),[pathCourses,setPathCourses]=useState<any[]>([]);
 const [users,setUsers]=useState<any[]>([]),[totalUsers,setTotalUsers]=useState(0),[enrollments,setEnrollments]=useState<Enrollment[]>([]),[totalEnrollments,setTotalEnrollments]=useState(0);
 const [selectedPath,setSelectedPath]=useState(''),[editingPathId,setEditingPathId]=useState(''),[form,setForm]=useState<any>(emptyPath),[msg,setMsg]=useState('');
 const [userQ,setUserQ]=useState(''),[accessQ,setAccessQ]=useState(''),[grantUser,setGrantUser]=useState(''),[grantPath,setGrantPath]=useState('');
 const [thumbnailFile,setThumbnailFile]=useState<File|null>(null),[uploading,setUploading]=useState(false),[draggedId,setDraggedId]=useState('');

 const load=async()=>{
  const m=await fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json());setMe(m.user);if(m.user?.role!=='admin')return;
  const [p,c,u,e]=await Promise.all([
   fetch('/api/admin/paths').then(r=>r.json()),fetch('/api/admin/courses').then(r=>r.json()),
   fetch('/api/admin/users?q='+encodeURIComponent(userQ)).then(r=>r.json()),
   fetch('/api/admin/path-enrollments?q='+encodeURIComponent(accessQ)).then(r=>r.json())
  ]);
  setPaths(p.paths||[]);setCourses(c.courses||[]);setUsers(u.users||[]);setTotalUsers(Number(u.total||0));setEnrollments(e.enrollments||[]);setTotalEnrollments(Number(e.total||0));
 };
 const loadPathCourses=async(id:string)=>{setSelectedPath(id);if(!id){setPathCourses([]);return}const r=await fetch('/api/admin/paths/courses?pathId='+id);const j=await r.json();setPathCourses(j.courses||[])};
 useEffect(()=>{load()},[userQ,accessQ]);
 useEffect(()=>{if(selectedPath)loadPathCourses(selectedPath)},[selectedPath]);

 const uploadThumbnail=async(file:File)=>{
  const id=editingPathId||`draft-${Date.now()}`;
  const r=await fetch('/api/admin/upload/presign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseId:`path-${id}`,namespace:'path-thumbnails',name:file.name,type:file.type,size:file.size})});
  const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not prepare thumbnail upload');
  setUploading(true);
  try{const x=await fetch(j.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});if(!x.ok)throw new Error('Thumbnail upload failed.');return j.url}
  finally{setUploading(false)}
 };
 const savePath=async()=>{
  try{
   setMsg('');
   let thumbnailUrl=form.thumbnailUrl||'';
   if(thumbnailFile){setMsg('Uploading path thumbnail…');thumbnailUrl=await uploadThumbnail(thumbnailFile)}
   const method=editingPathId?'PUT':'POST';
   const body={...form,thumbnailUrl,price:form.isFree?0:Number(form.price||0),id:editingPathId||undefined};
   const r=await fetch('/api/admin/paths',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not save path.');
   setMsg(editingPathId?'Path updated.':'Path created.');setForm(emptyPath);setThumbnailFile(null);setEditingPathId('');await load();if(body.id)loadPathCourses(body.id);
  }catch(e:any){setMsg(e.message||'Could not save path.')}
 };
 const editPath=(p:Path)=>{setEditingPathId(p.id);setForm({title:p.title,slug:p.slug,description:p.description,category:p.category,level:p.level,thumbnailUrl:p.thumbnail_url||'',isFree:p.is_free,price:p.price,published:p.published,whatsappNumber:p.whatsapp_number||''});setThumbnailFile(null);setSelectedPath(p.id);window.scrollTo({top:0,behavior:'smooth'})};
 const deletePath=async(id:string)=>{if(!confirm('Delete this path and its access records?'))return;const r=await fetch('/api/admin/paths',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});setMsg(r.ok?'Path deleted.':'Could not delete path.');if(selectedPath===id){setSelectedPath('');setPathCourses([])}load()};
 const addCourse=async(courseId:string)=>{if(!selectedPath||!courseId)return;const r=await fetch('/api/admin/paths/courses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pathId:selectedPath,courseId})});const j=await r.json();setMsg(r.ok?'Course added to path.':j.error||'Could not add course.');if(r.ok){await loadPathCourses(selectedPath);load()}};
 const removeCourse=async(courseId:string)=>{if(!selectedPath||!confirm('Remove this course from the path?'))return;const r=await fetch('/api/admin/paths/courses',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({pathId:selectedPath,courseId})});setMsg(r.ok?'Course removed from path.':'Could not remove course.');if(r.ok){await loadPathCourses(selectedPath);load()}};
 const reorder=async(next:any[])=>{setPathCourses(next);const r=await fetch('/api/admin/paths/courses',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({pathId:selectedPath,orderedIds:next.map(x=>x.id)})});if(!r.ok)setMsg('Could not save path order.');else setMsg('Path course order saved.')};
 const drop=(target:string)=>{if(!draggedId||draggedId===target)return;const next=[...pathCourses],from=next.findIndex(x=>x.id===draggedId),to=next.findIndex(x=>x.id===target);const [item]=next.splice(from,1);next.splice(to,0,item);setDraggedId('');reorder(next)};
 const grant=async()=>{if(!grantUser||!grantPath)return;const r=await fetch('/api/admin/path-enrollments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:grantUser,pathId:grantPath})});const j=await r.json();setMsg(r.ok?'Path access granted.':j.error||'Could not grant path access.');if(r.ok){setGrantUser('');load()}};
 const revoke=async(userId:string,pathId:string)=>{if(!confirm('Revoke this path access? Individual course access will remain untouched.'))return;const r=await fetch('/api/admin/path-enrollments',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,pathId})});const j=await r.json();setMsg(r.ok?'Path access revoked.':j.error||'Could not revoke path access.');if(r.ok)load()};

 if(me===null)return <main className={styles.page}><div className={styles.shell}><p>Checking administrator session…</p></div></main>;
 if(me.role!=='admin')return <main className={styles.page}><div className={styles.shell}><div className={styles.error}>Administrator access required.</div><Link className={styles.btn} href="/">Back</Link></div></main>;

 const current=paths.find(p=>p.id===selectedPath);
 const available=courses.filter(c=>!pathCourses.some(pc=>pc.course_id===c.id));
 return <main className={styles.page}><div className={styles.shell}>
  <nav className={styles.nav}><Link href="/" className={styles.brand}>MARWAN<span>.SWEDAN</span></Link><div className={styles.navlinks}><Link href="/admin">Courses Dashboard</Link><Link href="/paths">View paths</Link></div><button className={styles.btn} onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});location.href='/'}}>Sign out</button></nav>
  <header className={styles.header}><div><div className={styles.eyebrow}>Paths Console</div><h1>Build learning journeys.</h1><p>Manage paths independently from the existing Courses Dashboard.</p></div><Link className={styles.btn} href="/admin">Open Courses Dashboard ↗</Link></header>
  {msg&&<div className={styles.notice}>{msg}</div>}
  <div className={styles.layout}>
   <aside className={styles.card}><div className={styles.cardHead}><h2>Your paths</h2><span>{paths.length}</span></div>{paths.length===0?<p className={styles.muted}>No paths yet.</p>:paths.map(p=><div className={selectedPath===p.id?styles.pathItemActive:styles.pathItem} key={p.id}><button onClick={()=>loadPathCourses(p.id)}><b>{p.title}</b><small>{p.published?'Published':'Draft'} · {p.is_free?'Free':`${p.price} EGP`} · {p.course_count||0} courses</small></button><div><button onClick={()=>editPath(p)}>Edit</button><button onClick={()=>deletePath(p.id)}>Delete</button></div></div>)}<button className={styles.primaryBtn} onClick={()=>{setForm(emptyPath);setEditingPathId('');setThumbnailFile(null);setSelectedPath('');setPathCourses([])}}>+ New path</button></aside>
   <section className={styles.main}>
    <div className={styles.card}><div className={styles.cardHead}><div><div className={styles.eyebrow}>{editingPathId?'Edit path':'New path'}</div><h2>{editingPathId?form.title||'Edit path':'Create path'}</h2></div>{editingPathId&&<button className={styles.btn} onClick={()=>{setEditingPathId('');setForm(emptyPath)}}>Cancel</button>}</div>
     <div className={styles.formGrid}><div>
      <label>Path title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <label>URL slug<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label>
      <label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label>
      <label>Level<input value={form.level} onChange={e=>setForm({...form,level:e.target.value})}/></label>
     </div><div>
      <label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <label>Path thumbnail<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={e=>setThumbnailFile(e.target.files?.[0]||null)}/>{form.thumbnailUrl&&<div className={styles.thumb} style={{backgroundImage:`url(${form.thumbnailUrl})`}}/>}</label>
      <label>Access model<select value={form.isFree?'free':'paid'} onChange={e=>setForm({...form,isFree:e.target.value==='free'})}><option value="free">Free</option><option value="paid">Paid</option></select></label>
      {!form.isFree&&<label>Price · EGP<input type="number" min="1" step="0.01" value={form.price||''} onChange={e=>setForm({...form,price:Number(e.target.value)})}/></label>}
      <label>WhatsApp Request Access number<input inputMode="numeric" value={form.whatsappNumber} onChange={e=>setForm({...form,whatsappNumber:e.target.value.replace(/\D/g,'').slice(0,15)})} placeholder="201515227612"/><small>Digits only. Leave empty for 201515227612.</small></label>
      <label>Publishing<select value={form.published?'published':'draft'} onChange={e=>setForm({...form,published:e.target.value==='published'})}><option value="draft">Draft</option><option value="published">Published</option></select></label>
     </div></div>
     <div className={styles.actions}><button className={styles.primaryBtn} disabled={uploading} onClick={savePath}>{uploading?'Uploading…':editingPathId?'Save changes':'Create path'}</button></div>
    </div>
    {selectedPath&&<div className={styles.card}><div className={styles.cardHead}><div><div className={styles.eyebrow}>Path builder</div><h2>{current?.title||'Path'}</h2></div><span className={styles.pill}>{current?.published?'LIVE':'DRAFT'}</span></div><p className={styles.muted}>Add existing Courses, then drag them to set the learning order. Courses remain independent playlists.</p>
      <div className={styles.addRow}><select defaultValue="" onChange={e=>{if(e.target.value){addCourse(e.target.value);e.currentTarget.value=''}}}><option value="">+ Add an existing course…</option>{available.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      <div className={styles.courseList}>{pathCourses.length===0?<div className={styles.empty}>This path has no courses yet.</div>:pathCourses.map((c,i)=><div className={styles.courseRow} draggable key={c.id} onDragStart={()=>setDraggedId(c.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(c.id)}><span className={styles.drag}>⠿</span><span className={styles.number}>{i+1}</span><div><b>{c.title}</b><small>{c.duration_minutes} min · {c.published?'Published':'Draft'} · {c.is_free?'Free':`${c.price} EGP`}</small></div><button className={styles.danger} onClick={()=>removeCourse(c.course_id)}>Remove</button></div>)}</div>
    </div>}
   </section>
  </div>
  <section className={styles.card}><div className={styles.cardHead}><div><div className={styles.eyebrow}>Path access control</div><h2>Grant / revoke access</h2></div><span className={styles.total}>{totalEnrollments} active grants</span></div>
   <div className={styles.accessGrid}><div><h3>Grant Path Access</h3><select value={grantUser} onChange={e=>setGrantUser(e.target.value)}><option value="">Select account…</option>{users.map(u=><option key={u.id} value={u.id}>{u.name||u.username} · @{u.username}</option>)}</select><select value={grantPath} onChange={e=>setGrantPath(e.target.value)}><option value="">Select path…</option>{paths.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><button className={styles.primaryBtn} onClick={grant}>Grant access</button></div>
   <div><h3>Search accounts</h3><input value={userQ} onChange={e=>setUserQ(e.target.value)} placeholder="Name, username, phone, email"/><p className={styles.muted}>{totalUsers} total accounts. The list defaults to the latest 5 and searches all accounts.</p></div></div>
   <div className={styles.searchBar}><input value={accessQ} onChange={e=>setAccessQ(e.target.value)} placeholder="Search active Path access…"/></div>
   <div className={styles.accessList}>{enrollments.length===0?<div className={styles.empty}>No active Path access records.</div>:enrollments.map(e=><div className={styles.accessRow} key={e.id}><div><b>{e.name||e.username}</b><small>@{e.username} · {e.whatsapp} · {e.path_title}</small></div><button className={styles.danger} onClick={()=>revoke(e.user_id,e.path_id)}>Revoke</button></div>)}</div>
  </section>
  <div className={styles.footerNote}>Courses Dashboard is intentionally untouched. This is a separate Paths administration surface.</div>
 </div></main>;
}
