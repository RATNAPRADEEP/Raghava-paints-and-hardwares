const SOURCES=[
  {url:'https://www.asianpaints.com/paint-products/interior-wall-paints/plain-finishes.html',category:'Interior Paints'},
  {url:'https://www.asianpaints.com/paint-products/exterior-wall-paints/plain-finishes.html',category:'Exterior Paints'},
  {url:'https://www.asianpaints.com/products/waterproofing-solutions/all-products.html',category:'Waterproofing'}
];

function json(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(body));
}

function cleanText(html){
  return String(html||'')
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&#8377;|&#x20b9;/gi,'₹')
    .replace(/\s+/g,' ')
    .trim();
}

function extractProducts(text,category,source){
  const out=[];const re=/([A-Za-z][A-Za-z0-9+&()./' -]{2,110}?)\s+(?:Most popular\s+|New Launch\s+)?(?:MRP\s*)?₹\s*([0-9,]+(?:\.[0-9]+)?)\s*\(Inclusive of all taxes\)\s*per L/gi;
  let m;
  while((m=re.exec(text))){
    let name=m[1].replace(/^(Compare|Image|Input|Most popular|New Launch)\s+/gi,'').replace(/\s+/g,' ').trim();
    name=name.replace(/^.*?([A-Z][A-Za-z0-9+&()./' -]{2,90})$/,'$1').trim();
    if(name.length<3||name.length>100)continue;
    if(/^(the price|please note|price per litre|inclusive of all taxes|popular exterior emulsions)/i.test(name))continue;
    const price=Number(String(m[2]).replace(/,/g,''));
    if(!Number.isFinite(price))continue;
    if(!out.some(x=>x.name.toLowerCase()===name.toLowerCase()))out.push({name,brand:'Asian Paints',category,pricePerLitre:price,source});
  }
  return out;
}

module.exports=async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed.'});
  try{
    const body=req.body||{};const current=Array.isArray(body.records)?body.records:[];
    const pages=await Promise.all(SOURCES.map(async s=>{
      const r=await fetch(s.url,{headers:{'User-Agent':'Mozilla/5.0 RaghavaPaintsCatalogueUpdater'}});
      if(!r.ok)throw Error('Official catalogue page returned '+r.status+': '+s.url);
      return {source:s,text:cleanText(await r.text()),category:s.category};
    }));
    const web=pages.flatMap(p=>extractProducts(p.text,p.category,p.source));
    const byName=new Map(current.map(x=>[String(x.name||'').trim().toLowerCase(),x]));
    const updates=[];
    for(const w of web){
      const old=byName.get(w.name.toLowerCase());
      if(!old){
        updates.push({...w,change:'new product'});
      }else{
        const oldPrice=Number(old.sellingPrice);
        if(Number.isFinite(oldPrice)&&oldPrice!==w.pricePerLitre)updates.push({...w,change:'price changed from ₹'+oldPrice+' to ₹'+w.pricePerLitre+' per L'});
      }
    }
    return json(res,200,{checkedAt:new Date().toISOString(),sourceCount:SOURCES.length,webProductCount:web.length,updates});
  }catch(e){
    return json(res,502,{error:e.message||'Could not check the official catalogue.'});
  }
};
