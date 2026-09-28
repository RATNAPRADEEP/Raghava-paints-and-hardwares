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
    const productContext=Array.isArray(body.productContext)?body.productContext.slice(0,8).map(p=>({
      type:String(p?.kind||'').slice(0,40),sku:String(p?.sku||'').slice(0,80),name:String(p?.name||'').slice(0,160),
      brand:String(p?.brand||'').slice(0,100),productType:String(p?.type||'').slice(0,100),category:String(p?.category||'').slice(0,100),
      variant:String(p?.variant||'').slice(0,100),size:String(p?.size||'').slice(0,60),unit:String(p?.unit||'').slice(0,30),
      shade:String(p?.shade||'').slice(0,100),finish:String(p?.finish||'').slice(0,80),
      sellingPrice:p?.sellingPrice??'',gstPercent:p?.gstPercent??'',barcode:String(p?.barcode||'').slice(0,100),
      verifiedOn:String(p?.verifiedOn||'').slice(0,40),source:String(p?.source||'').slice(0,120),notes:String(p?.notes||'').slice(0,300)
    })):[];
    const catalogueContext=productContext.length
      ? '\\n\\nCURRENT SHOP CATALOGUE MATCHES (use only when relevant; these are read-only product details supplied by the shop app):\\n'+JSON.stringify(productContext)
      : '';
    const input=[
      {role:'system',content:'You are the AI Assistant for Raghava Paints and Hardwares. You may receive a small read-only set of current catalogue matches from the shop app. Use those product details when answering product-specific questions. Do not invent product specifications, prices, availability, colours, coverage, or features that are not present in the supplied catalogue context. Do not reveal internal purchase costs, supplier details, rack locations, customer records, sales records, or other private shop data. If the requested product detail is not present, say that the catalogue does not contain that detail and then give general guidance if useful. For general paint, painting, colour, surface-preparation, tool-selection, and hardware questions, give practical, clear answers suitable for a local paint and hardware shop.'+catalogueContext},
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
        max_output_tokens:700,
        store:false
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
