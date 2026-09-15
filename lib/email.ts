export async function sendEmail(to:string,subject:string,text:string){
  const key=process.env.BREVO_API_KEY||'';
  const from=process.env.EMAIL_FROM||'';
  if(!key||!from)throw new Error('EMAIL_NOT_CONFIGURED');
  const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{accept:'application/json','api-key':key,'content-type':'application/json'},body:JSON.stringify({sender:{email:from,name:'Marwan Swedan Academy'},to:[{email:to}],subject,textContent:text})});
  if(!response.ok){
    console.error('EMAIL_SEND_FAILED',{status:response.status,statusText:response.statusText});
    throw new Error('EMAIL_SEND_FAILED');
  }
  return response.json();
}