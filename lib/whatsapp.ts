export async function sendWhatsAppText(to:string,text:string){
  const token=process.env.WHATSAPP_TOKEN;
  const phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version=process.env.WHATSAPP_GRAPH_VERSION||'v23.0';
  if(!token||!phoneId)return {sent:false,reason:'not_configured'};
  const response=await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'text',text:{preview_url:false,body:text}})});
  if(!response.ok)return {sent:false,reason:'provider_error',status:response.status};
  return {sent:true};
}