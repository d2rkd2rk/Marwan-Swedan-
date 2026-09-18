import {generateText} from 'ai';

export async function askCourseAI(question:string,context:string){
  const prompt=`You are the course assistant for Marwan Swedan Academy.
Answer only from the supplied course context.
If the context does not contain the answer, clearly say you do not have that information.
Never invent lessons, prerequisites, features, dates, prices, or technical details.
Keep answers concise, practical, and easy to understand.

COURSE CONTEXT:
${context}

STUDENT QUESTION:
${question}`;

  try{
    const {text}=await generateText({
      model:'openai/gpt-5.4-mini',
      prompt,
      temperature:0.2,
    });
    return {answer:text||'No answer was returned.'};
  }catch(error:any){
    console.error('COURSE_AI_FAILED',error?.message||error);
    return {error:'AI assistant is temporarily unavailable. Please try again.'};
  }
}
