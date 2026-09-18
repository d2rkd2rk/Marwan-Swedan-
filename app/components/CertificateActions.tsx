'use client';
export default function CertificateActions({shareUrl}:{shareUrl:string}){
 const linkedIn=`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
 return <div className="certificateActions"><a className="btn primary" href={linkedIn} target="_blank" rel="noreferrer">in&nbsp; Share on LinkedIn ↗</a><button className="btn" onClick={()=>window.print()}>Print / Save PDF</button></div>;
}
