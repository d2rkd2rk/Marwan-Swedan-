import type {MetadataRoute} from 'next';

const siteUrl='https://marwanswedan.online';

export default function sitemap():MetadataRoute.Sitemap{
 return [
  {
   url:siteUrl+'/',
   lastModified:new Date(),
   changeFrequency:'weekly',
   priority:1,
  },
  {
   url:siteUrl+'/courses',
   lastModified:new Date(),
   changeFrequency:'weekly',
   priority:0.9,
  },
 ];
}
