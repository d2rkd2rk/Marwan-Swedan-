import Link from 'next/link';
import type {Metadata} from 'next';
import SiteNav from '@/app/components/SiteNav';
import s from '../home.module.css';

const siteUrl='https://marwanswedan.online';

export const metadata:Metadata={
 title:'About PROVENRA | Terms & Privacy',
 description:'Learn about PROVENRA, contact the academy, and read its Terms of Service and Privacy Policy.',
 alternates:{canonical:siteUrl+'/about-us'},
 robots:{index:true,follow:true},
 openGraph:{
  type:'website',
  siteName:'PROVENRA',
  title:'About PROVENRA | Terms & Privacy',
  description:'About the PROVENRA cybersecurity learning platform, its terms of use, and privacy practices.',
  url:siteUrl+'/about-us',
  locale:'en_US',
 },
};

const organization={
 '@context':'https://schema.org',
 '@type':'Organization',
 name:'PROVENRA',
 url:siteUrl,
 description:'An online learning platform focused on cybersecurity, digital forensics, SOC operations, incident response, and practical security education.',
 founder:{'@type':'Person',name:'Marwan Swedan'},
 contactPoint:{
  '@type':'ContactPoint',
  contactType:'customer support',
  url:'https://wa.me/201515227612',
  availableLanguage:['English','Arabic'],
 },
};

export default function AboutProvenraPage(){
 return <main className={s.page}>
  <div className={s.ambient}/>
  <div className={s.wrap}>
   <SiteNav/>
   <header className={s.section} style={{paddingTop:76,paddingBottom:66}}>
    <div className={s.label}>THE PLATFORM · POLICIES · SUPPORT</div>
    <h1 style={{fontFamily:'Space Grotesk',fontSize:'clamp(42px,7vw,76px)',letterSpacing:'-.055em',margin:'18px 0 14px'}}>About <span style={{color:'#d2b477'}}>PROVENRA.</span></h1>
    <p style={{maxWidth:760,color:'#b6b1a5',lineHeight:1.85,fontSize:15}}>A practical cybersecurity learning platform built to make technical education clearer, more structured, and more accessible. This page brings together information about the platform, contact details, terms of service, and privacy practices.</p>
    <div className={s.actions} style={{flexWrap:'wrap'}}>
     <a className={s.btn+' '+s.primary} href="https://wa.me/201515227612" target="_blank" rel="noopener noreferrer">Contact PROVENRA ↗</a>
     <Link className={s.btn} href="/about">Marwan Swedan — Personal Profile ↗</Link>
     <Link className={s.btn} href="/courses">Explore Courses ↗</Link>
    </div>
   </header>

   <section id="about-platform" className={s.section} style={{paddingTop:64,paddingBottom:64}}>
    <div className={s.label}>01 / ABOUT THE PLATFORM</div>
    <h2>Learn. Build. Secure. Grow.</h2>
    <p style={{maxWidth:850,color:'#b6b1a5',lineHeight:1.9}}>PROVENRA is an online cybersecurity education platform founded by Marwan Swedan. It provides structured courses and learning paths covering areas such as cybersecurity fundamentals, digital forensics, Security Operations Center (SOC) operations, incident response, and threat intelligence. The platform is designed to support learners through educational content, practical learning, progress tracking, and course-related resources.</p>
    <p style={{maxWidth:850,color:'#b6b1a5',lineHeight:1.9}}>Course availability, lesson access, and features may vary by course and by the learner’s account or enrollment status. The personal biography and professional portfolio of the founder are available separately on the <Link href="/about" style={{color:'#e0c98f',textDecoration:'underline'}}>Marwan Swedan profile page</Link>.</p>
   </section>

   <section id="contact" className={s.section} style={{paddingTop:64,paddingBottom:64}}>
    <div className={s.label}>02 / CONTACT</div>
    <h2>Get in touch.</h2>
    <p style={{maxWidth:760,color:'#b6b1a5',lineHeight:1.85}}>For questions about courses, account access, platform features, or privacy requests, contact PROVENRA through the official channel below.</p>
    <div className={s.projectGrid} style={{marginTop:24}}>
     <a className={s.course} href="https://wa.me/201515227612" target="_blank" rel="noopener noreferrer" style={{padding:24,display:'block'}}>
      <div className={s.label}>OFFICIAL SUPPORT CHANNEL</div><h3 style={{marginTop:14}}>WhatsApp Support ↗</h3><p style={{color:'#b6b1a5',lineHeight:1.7}}>Send a message to the PROVENRA team.</p>
     </a>
     <a className={s.course} href="https://www.linkedin.com/in/marwan-swedan" target="_blank" rel="noopener noreferrer" style={{padding:24,display:'block'}}>
      <div className={s.label}>PROFESSIONAL CONTACT</div><h3 style={{marginTop:14}}>LinkedIn ↗</h3><p style={{color:'#b6b1a5',lineHeight:1.7}}>Connect for professional and educational inquiries.</p>
     </a>
    </div>
    <p style={{color:'#827e74',fontSize:12,lineHeight:1.7,marginTop:20}}>The address no-reply@marwanswedan.online may be used for automated outgoing messages. It is not listed here as a monitored support inbox.</p>
   </section>

   <section id="terms" className={s.section} style={{paddingTop:64,paddingBottom:64}}>
    <div className={s.label}>03 / TERMS OF SERVICE</div>
    <h2>Using PROVENRA.</h2>
    <p style={{color:'#827e74',fontSize:12}}>Effective date: November 16, 2026</p>
    <div style={{maxWidth:900,color:'#b6b1a5',lineHeight:1.9}}>
     <h3>1. Acceptance and eligibility</h3>
     <p>By accessing or using PROVENRA, you agree to these Terms. If you do not agree, do not use the platform. You must provide accurate information and be legally able to use the services under the laws that apply to you. If you are not legally able to accept these Terms, use the platform only with the involvement and permission of a parent or legal guardian where required.</p>
     <h3>2. Accounts and security</h3>
     <p>You are responsible for keeping your login credentials confidential, providing accurate account information, and activity carried out through your account. Do not impersonate another person, share access in a way that bypasses course restrictions, or attempt to access another user’s account. Contact us if you believe your account has been compromised.</p>
     <h3>3. Courses, enrollment, and access</h3>
     <p>Some courses or learning materials may be free, while others may require payment or an approved enrollment. Access is personal to the enrolled account and is subject to the course description and the access status shown by the platform. We may update course content, lesson order, availability, or platform features as the academy develops. Paid access is not transferable unless PROVENRA expressly agrees otherwise.</p>
     <h3>4. Acceptable use</h3>
     <p>You may use the platform for lawful educational purposes only. You must not copy, redistribute, resell, publicly stream, or otherwise exploit course materials without permission; interfere with the platform; probe or attack its systems; upload unlawful or harmful material; manipulate reviews or progress records; or use the platform to facilitate unauthorized access, cyber abuse, or other illegal activity.</p>
     <h3>5. Intellectual property</h3>
     <p>Unless stated otherwise, the platform’s original branding, course materials, written content, graphics, and other academy content are owned by PROVENRA or used with permission and are protected by applicable intellectual-property laws. Access to a course does not transfer ownership or grant a right to redistribute its materials. Third-party names, marks, and materials remain the property of their respective owners.</p>
     <h3>6. Progress, reviews, and certificates</h3>
     <p>Progress indicators are provided to help learners track their studies. Reviews must be genuine, relevant, and respectful; PROVENRA may remove content that violates these Terms or applicable law. Certificates are issued only when the applicable course requirements have been met and the platform’s required verification or approval process has been completed. A certificate confirms completion of the stated learning activity and is not a professional licence or guarantee of employment.</p>
     <h3>7. Availability and changes</h3>
     <p>We work to keep PROVENRA available and secure, but uninterrupted or error-free operation cannot be guaranteed. We may maintain, modify, suspend, or discontinue features or content when reasonably necessary, including for security, legal, or operational reasons.</p>
     <h3>8. Disclaimers and limitation</h3>
     <p>Educational content is provided for learning and informational purposes. It does not authorize testing systems or networks without permission and is not a substitute for professional legal, security, or other advice. To the extent permitted by law, PROVENRA is not liable for indirect or consequential losses arising from use of the platform. Nothing in these Terms excludes liability that cannot legally be excluded.</p>
     <h3>9. Changes and contact</h3>
     <p>We may update these Terms as the platform evolves. The latest version will be published on this page with its effective date. Continued use after an update means you accept the revised Terms to the extent permitted by law. For questions, use the contact details in the Contact section above.</p>
    </div>
   </section>

   <section id="privacy" className={s.section} style={{paddingTop:64,paddingBottom:64}}>
    <div className={s.label}>04 / PRIVACY POLICY</div>
    <h2>Your privacy matters.</h2>
    <p style={{color:'#827e74',fontSize:12}}>Effective date: November 16, 2026</p>
    <div style={{maxWidth:900,color:'#b6b1a5',lineHeight:1.9}}>
     <h3>1. Information we collect</h3>
     <p>Depending on how you use PROVENRA, we may collect information you provide, such as your name, username, phone number, profile photo, account details, messages sent to us, course reviews, and other information you choose to submit. We also process learning-related information such as course enrollments, lesson progress, completion status, and certificate records.</p>
     <h3>2. Technical and usage information</h3>
     <p>When you access the platform, our systems and service providers may process technical information such as IP address, browser and device type, operating system, referring pages, access times, and interactions with pages or features. This information may be used for security, troubleshooting, service operation, and understanding platform usage.</p>
     <h3>3. How we use information</h3>
     <p>We use information to create and manage accounts, authenticate users, provide course access, record learning progress, issue and verify certificates, display and moderate reviews, respond to support requests, maintain security, prevent misuse, operate and improve the platform, and comply with legal obligations.</p>
     <h3>4. Cookies and similar technologies</h3>
     <p>PROVENRA and its service providers may use cookies, local storage, session technologies, and similar tools to keep users signed in, protect accounts, remember preferences, support platform functionality, and measure or improve services. You can manage or delete cookies through your browser settings; disabling certain technologies may affect features such as sign-in or saved preferences.</p>
     <h3>5. Google AdSense and advertising partners</h3>
     <p>PROVENRA uses or may use Google AdSense to display advertisements. Google and its partners may use cookies or similar technologies to collect or receive information from this website and other websites, including information about your browser, device, IP address, and interactions with advertisements, to provide, measure, and where permitted personalize advertising. Advertising may be shown on public pages and within signed-in areas, including course and dashboard pages; advertisements are not placed inside lesson video players by PROVENRA.</p>
     <p>Users can learn about Google’s advertising practices and manage ad-personalization settings through <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" style={{color:'#e0c98f',textDecoration:'underline'}}>Google Ads Settings</a>. Information about how Google uses data from sites or apps that use its services is available in <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" style={{color:'#e0c98f',textDecoration:'underline'}}>Google’s partner-site data policy</a>. Depending on your location, additional consent choices or disclosures may be presented or required.</p>
     <h3>6. How information may be shared</h3>
     <p>We may share information with service providers that help us host, secure, operate, and deliver the platform, including database, infrastructure, authentication, communications, and advertising providers. Information may also be disclosed when required by law, to protect users or the platform, or in connection with a legitimate reorganization of the service. We do not publish private account credentials.</p>
     <h3>7. Data security and retention</h3>
     <p>We use reasonable technical and organizational measures designed to protect information. No internet service can guarantee absolute security. We retain information for as long as reasonably necessary to provide the service, maintain account and course records, resolve disputes, enforce our Terms, and meet legal or security requirements.</p>
     <h3>8. Your choices and requests</h3>
     <p>You may update certain account details through available account features and may contact us to request access to, correction of, or deletion of personal information, subject to applicable law and legitimate record-keeping or security requirements. You can control browser cookies through your device settings and manage Google ad personalization through Google’s settings.</p>
     <h3>9. Children’s privacy</h3>
     <p>PROVENRA is a general educational platform and is not designed to knowingly collect personal information from children in violation of applicable law. If you believe a child has provided personal information inappropriately, contact us so we can review the request.</p>
     <h3>10. Third-party websites</h3>
     <p>The platform may link to third-party websites or services. Their privacy practices are governed by their own policies, and we encourage you to review those policies before sharing information with them.</p>
     <h3>11. International users and policy updates</h3>
     <p>Your information may be processed in countries where our service providers operate, subject to applicable safeguards and laws. We may update this Policy when our practices or legal requirements change. The latest version and effective date will appear on this page.</p>
     <h3>12. Contact about privacy</h3>
     <p>For privacy questions or requests, contact PROVENRA using the official WhatsApp support channel listed above. Please do not send passwords or sensitive account credentials in a support message.</p>
    </div>
   </section>

   <footer className={s.footer}>
    <div><div className={s.footerBrand}>PROVENRA</div><p>Cybersecurity · Digital Forensics · Practical Education</p><p>© 2026 PROVENRA. All rights reserved.</p></div>
    <div><h4>EXPLORE</h4><Link href="/">Home</Link><Link href="/courses">Academy</Link><Link href="/paths">Learning Paths</Link><Link href="/about">Marwan Swedan</Link></div>
    <div><h4>ON THIS PAGE</h4><a href="#about-platform">About the Platform</a><a href="#contact">Contact</a><a href="#terms">Terms of Service</a><a href="#privacy">Privacy Policy</a></div>
    <div><h4>SUPPORT</h4><a href="https://wa.me/201515227612" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a><a href="https://www.linkedin.com/in/marwan-swedan" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div>
   </footer>
  </div>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organization)}}/>
 </main>;
}
