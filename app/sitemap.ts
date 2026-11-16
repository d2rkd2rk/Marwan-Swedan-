import type {MetadataRoute} from 'next';

const siteUrl='https://marwanswedan.online';

export default function sitemap():MetadataRoute.Sitemap{
 return [
  {url:siteUrl+'/'},
  {url:siteUrl+'/about'},
  {url:siteUrl+'/about-us'},
  {url:siteUrl+'/courses'},
 ];
}
