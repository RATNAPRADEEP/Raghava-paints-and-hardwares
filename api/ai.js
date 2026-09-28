const MODEL='gpt-5.6-luna';

function json(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify(body));
}

module.exports=async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed.'});
  if(!process.env.OPENAI_API_KEY)return json(res,503,{error:'AI is not configured yet. Add OPENAI_API_KEY to the Vercel environment variables.'});

  try{
    const body=req.body||{};
    const message=String(body.message||'').trim();
    if(!message)return json(res,400,{error:'Please enter a question.'});
    if(message.length>4000)return json(res,400,{error:'Question is too long.'});

    const history=Array.isArray(body.history)?body.history.slice(-8).filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,4000)})):[];
    const input=[
      {role:'system',content:'You are the standalone AI Assistant for Raghava Paints and Hardwares. At this stage you are independent from the shop application data. Do not claim to know current inventory, sales, purchases, prices, customers, invoices, Google Drive data, or other private shop records. Help with general paint, painting, colour, surface-preparation, tool-selection, and hardware questions. Give practical, clear answers suitable for a local paint and hardware shop. If a question requires current shop data, say that this version is not connected to that data yet.'},
      ...history,
      {role:'user',content:message}
    ];

    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{
        'Authorization':'Bearer '+process.env.OPENAI_API_KEY,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        model:MODEL,
        input,
        max_output_tokens:700
      })
    });

    const data=await response.json();
    if(!response.ok)return json(res,response.status,{error:data?.error?.message||'The AI service returned an error.'});

    const answer=String(data.output_text||'').trim();
    if(!answer)return json(res,502,{error:'The AI service returned an empty response.'});
    return json(res,200,{answer});
  }catch(e){
    return json(res,500,{error:'Unable to reach the AI service right now.'});
  }
};
