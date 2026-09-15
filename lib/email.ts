export async function sendEmail(to:string,subject:string,text:string){
  const key=process.env.RESEND_API_KEY||'';
  const from=process.env.EMAIL_FROM||'';
  if(!key||!from)throw new Error('EMAIL_NOT_CONFIGURED');
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to,subject,text})});
  if(!response.ok){
    console.error('EMAIL_SEND_FAILED', {status:response.status, statusText:response.statusText});
    throw new Error('EMAIL_SEND_FAILED');
  }
  return response.json();
}