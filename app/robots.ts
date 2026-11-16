import type {MetadataRoute} from 'next';

const siteUrl='https://marwanswedan.online';

const privatePaths=[
 '/api/',
 '/admin',
 '/account',
 '/dashboard',
 '/login',
 '/register',
 '/forgot-password',
 '/auth',
 '/paths',
 '/course',
 '/payment',
];

export default function robots():MetadataRoute.Robots{
 return {
  rules:[
   {
    userAgent:'*',
    allow:'/',
    disallow:privatePaths,
   },
   {
    userAgent:['OAI-SearchBot','ChatGPT-User'],
    allow:'/',
    disallow:privatePaths,
   },
   {
    userAgent:['Claude-SearchBot','Claude-User'],
    allow:'/',
    disallow:privatePaths,
   },
   {
    userAgent:['PerplexityBot','Perplexity-User'],
    allow:'/',
    disallow:privatePaths,
   },
  ],
  sitemap:siteUrl+'/sitemap.xml',
  host:siteUrl,
 };
}
