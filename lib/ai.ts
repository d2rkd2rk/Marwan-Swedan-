export async function askCourseAI(question:string,context:string){
  const key=process.env.AI_API_KEY;
  if(!key)return {answer:'AI assistant is not configured yet. The course information is available in the course overview and lesson list.'};
  const base=process.env.AI_BASE_URL||'https://api.openai.com/v1';
  const model=process.env.AI_MODEL||'gpt-5-mini';
  const response=await fetch(`${base}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,temperature:0.2,messages:[{role:'system',content:`You are the course assistant for Marwan Swedan Academy. Answer only from the supplied course context. If the context does not contain the answer, say you do not have that information. Keep answers concise and practical.\n\nCOURSE CONTEXT:\n${context}`},{role:'user',content:question}]})});
  if(!response.ok)throw new Error('AI_PROVIDER_ERROR');
  const data=await response.json();
  return {answer:data?.choices?.[0]?.message?.content||'No answer was returned.'};
}