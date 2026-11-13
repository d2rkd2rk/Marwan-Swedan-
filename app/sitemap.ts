import type {MetadataRoute} from 'next';

const siteUrl='https://marwanswedan.online';

export default function sitemap():MetadataRoute.Sitemap{
 const now=new Date();
 return [
  {url:siteUrl+'/',lastModified:now,changeFrequency:'weekly',priority:1},
  {url:siteUrl+'/about',lastModified:now,changeFrequency:'monthly',priority:0.9},
  {url:siteUrl+'/courses',lastModified:now,changeFrequency:'weekly',priority:0.9},
 ];
}
