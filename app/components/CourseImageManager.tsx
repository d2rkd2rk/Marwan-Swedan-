'use client';
import {useEffect} from 'react';

export default function CourseImageManager(){
 useEffect(()=>{
  if(location.pathname!=='/admin')return;
  let file:File|null=null;let busy=false;
  const timer=window.setInterval(()=>{
   const card=document.querySelector<HTMLElement>('.adminMain > .card');
   if(!card||card.querySelector('[data-course-image-manager]'))return;
   const host=document.createElement('div');host.setAttribute('data-course-image-manager','1');host.className='field';
   host.innerHTML='<label>Course cover image</label><div class="courseImagePreview"><div class="imageFallback">Choose a cover image for this course</div></div><div class="courseImageInput"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"/><span class="small muted">JPG, PNG, WebP, GIF or AVIF · recommended 16:9</span></div>';
   const anchor=card.querySelector('.grid');anchor?.parentElement?.insertBefore(host,anchor);
   const input=host.querySelector<HTMLInputElement>('input[type=file]');const preview=host.querySelector<HTMLElement>('.courseImagePreview');
   input?.addEventListener('change',()=>{file=input.files?.[0]||null;if(!file||!preview)return;const url=URL.createObjectURL(file);preview.innerHTML=`<img src="${url}" alt="Course cover preview"/>`});
  },350);
  const original=window.fetch.bind(window);
  window.fetch=async(input:RequestInfo|URL,init?:RequestInit)=>{
   const url=typeof input==='string'?input:input instanceof URL?input.toString():input.url;const method=(init?.method||'GET').toUpperCase();
   if(!file||busy||!url.includes('/api/admin/courses')||!['POST','PUT'].includes(method))return original(input,init);
   busy=true;
   try{
    const body=typeof init?.body==='string'?JSON.parse(init.body):null;
    const first=await original(input,init);if(!first.ok){busy=false;return first}
    const created=await first.clone().json();const courseId=body?.id||created?.course?.id;
    if(!courseId){busy=false;return first}
    const prep=await original('/api/admin/upload/presign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({courseId,name:file.name,type:file.type,size:file.size})});
    const p=await prep.json();if(!prep.ok)throw new Error(p.error||'Could not prepare image upload');
    const put=await original(p.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});if(!put.ok)throw new Error('Image upload failed');
    const thumbnailUrl=`/api/course-image?pathname=${encodeURIComponent(p.pathname)}`;
    const saved=await original('/api/admin/courses',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,id:courseId,thumbnailUrl})});
    if(!saved.ok)throw new Error('Course image could not be attached');
    file=null;busy=false;return saved;
   }catch(err){busy=false;alert(err instanceof Error?err.message:'Course image upload failed.');return original(input,init)}
  };
  return()=>{clearInterval(timer);window.fetch=original};
 },[]);
 return null;
}
