import Image from 'next/image';
import styles from './ProvenraCertificate.module.css';

type Props = {
  name: string;
  title: string;
  date: string;
  kind: 'course' | 'path';
};

function formatRecipientName(value:string){
  return value.replace(/(^|[\\s-])([a-z])/g,(_match,separator,letter)=>separator+letter.toUpperCase());
}

export default function ProvenraCertificate({name,title,date,kind}:Props) {
  return (
    <article className={styles.certificate}>
      <Image
        src="/images/provenra-certificate-template.png"
        alt="PROVENRA certificate of completion"
        fill
        priority
        unoptimized
        sizes="(max-width: 900px) 100vw, 1180px"
        className={styles.artwork}
      />
      <div className={styles.nameplate} aria-hidden="true" />
      <div className={styles.recipient}>{formatRecipientName(name)}</div>
      <div className={styles.completion}>
        <span>has successfully completed {kind === 'course' ? 'the course' : 'the learning path'}</span>
        <strong>{title}</strong>
      </div>
      <div className={styles.date}>{date}</div>
    </article>
  );
}
