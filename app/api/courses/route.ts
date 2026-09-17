import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
export async function GET(){
  try{
    const user=await requireUser();
    if(!process.env.DATABASE_URL)return NextResponse.json({courses:[]});
    const courses=await db`select c.id,c.title,c.slug,c.description,c.category,c.level,c.duration_minutes,c.thumbnail_url,c.is_free,c.price,c.published,case when e.id is not null and e.revoked_at is null then true else false end as enrolled from courses c left join enrollments e on e.course_id=c.id and e.user_id=${user.id} where c.published=true order by c.created_at desc`;
    return NextResponse.json({courses});
  }catch(e:any){return NextResponse.json({error:'Authentication required'},{status:401})}
}
