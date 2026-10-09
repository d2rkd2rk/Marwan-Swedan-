import type {MetadataRoute} from 'next';

const siteUrl='https://marwanswedan.online';

export default function robots():MetadataRoute.Robots{
 return {
  rules:{
   userAgent:'*',
   allow:'/',
   disallow:[
    '/api/',
    '/admin',
    '/account',
    '/dashboard',
    '/login',
    '/register',
    '/forgot-password',
    '/auth',
    '/courses',
    '/paths',
    '/course',
   ],
  },
  sitemap:siteUrl+'/sitemap.xml',
  host:siteUrl,
 };
}
