const FILES=['products.json','customers.json','suppliers.json','sales.json','purchases.json','stock-movements.json'];
let folder=null;
let db={products:[],customers:[],suppliers:[],sales:[],purchases:[],movements:[]};

const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(v||0));
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function message(text,type='good'){ $('message').innerHTML='<div class="notice '+(type==='danger'?'danger':'good')+'">'+esc(text)+'</div>';setTimeout(()=>{$('message').innerHTML=''},3000); }
function setConnection(connected){if($('connectionDot'))$('connectionDot').classList.toggle('connected',connected);if($('connectionText'))$('connectionText').textContent=connected?'Local data connected':'Local data not connected';if($('systemState'))$('systemState').textContent=connected?'Connected':'Ready';if($('systemStateDetail'))$('systemStateDetail').textContent=connected?'Reading and writing JSON files on this computer.':'Connect your local data folder to begin.';}
function go(section){document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.section===section));document.querySelectorAll('.section').forEach(x=>x.classList.add('hidden'));$(section).classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}


async function connect(){
  if(!window.showDirectoryPicker){message('Use Microsoft Edge or Google Chrome for local folder storage.','danger');return;}
  try{
    folder=await window.showDirectoryPicker({mode:'readwrite'});
    await loadFiles();
    setConnection(true);setConnection(false);renderAll();
    message('Local data folder connected.');
  }catch(e){if(e.name!=='AbortError')message(e.message,'danger');}
}

async function loadFiles(){
  const keys=['products','customers','suppliers','sales','purchases','movements'];
  for(let i=0;i<FILES.length;i++){
    const handle=await folder.getFileHandle(FILES[i],{create:true});
    const file=await handle.getFile();
    const text=await file.text();
    db[keys[i]]=text.trim()?JSON.parse(text):[];
  }
}

async function save(key,file){
  if(!folder){message('Connect the local data folder first.','danger');throw new Error('No data folder');}
  const handle=await folder.getFileHandle(file,{create:true});
  const writable=await handle.createWritable();
  await writable.write(JSON.stringify(db[key],null,2));
  await writable.close();
}

async function saveAll(){for(const [key,file] of [['products','products.json'],['customers','customers.json'],['suppliers','suppliers.json'],['sales','sales.json'],['purchases','purchases.json'],['movements','stock-movements.json']])await save(key,file);}

function options(rows,placeholder){return '<option value="">'+placeholder+'</option>'+rows.map(r=>'<option value="'+r.id+'">'+esc(r.name)+'</option>').join('');}

function renderAll(){
  const p=db.products,c=db.customers,s=db.suppliers;
  $('productsCount').textContent=p.length;
  $('stockCount').textContent=p.reduce((a,x)=>a+Number(x.stock),0).toLocaleString('en-IN');
  $('inventoryValue').textContent=money(p.reduce((a,x)=>a+Number(x.stock)*Number(x.purchasePrice),0));
  const today=new Date().toISOString().slice(0,10);
  const salesToday=db.sales.filter(x=>x.date.slice(0,10)===today);
  $('todaySales').textContent=money(salesToday.reduce((a,x)=>a+x.total,0));
  $('totalSales').textContent=money(db.sales.reduce((a,x)=>a+x.total,0));
  $('lowStockCount').textContent=p.filter(x=>Number(x.stock)<=Number(x.reorderLevel)).length;
  $('saleCustomer').innerHTML=options(c,'Walk-in customer');
  $('saleProduct').innerHTML=options(p,'Choose product');
  $('purchaseSupplier').innerHTML=options(s,'Choose supplier');
  $('purchaseProduct').innerHTML=options(p,'Choose product');
  $('productsTable').innerHTML='<tr><th>SKU</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr>'+p.map(x=>'<tr><td>'+esc(x.sku)+'</td><td>'+esc(x.name)+'<br><small>'+esc(x.brand)+'</small></td><td>'+esc(x.category)+'</td><td>'+money(x.sellingPrice)+'</td><td>'+x.stock+' '+esc(x.unit)+'</td><td>'+status(x)+'</td></tr>').join('');
  $('lowStock').innerHTML=p.filter(x=>Number(x.stock)<=Number(x.reorderLevel)).map(x=>'<p><b>'+esc(x.name)+'</b> — '+x.stock+' '+esc(x.unit)+'</p>').join('')||'<p>No low-stock products.</p>';
  const totals={};db.sales.flatMap(s=>s.items).forEach(i=>totals[i.productId]=(totals[i.productId]||0)+Number(i.quantity));
  $('topProducts').innerHTML=Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([pid,q])=>{const p=db.products.find(x=>x.id===pid);return '<p><b>'+esc(p?.name||'Unknown')+'</b> — '+q+'</p>'}).join('')||'<p>No sales yet.</p>';
  $('recentSales').innerHTML=tableSales(db.sales.slice().reverse().slice(0,8));
  $('salesTable').innerHTML=tableSales(db.sales.slice().reverse());
  $('purchasesTable').innerHTML=tablePurchases(db.purchases.slice().reverse());
  $('customersTable').innerHTML='<tr><th>Name</th><th>Phone</th><th>Address</th></tr>'+c.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.address)+'</td></tr>').join('');
  $('suppliersTable').innerHTML='<tr><th>Name</th><th>Phone</th><th>Email</th></tr>'+s.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.email)+'</td></tr>').join('');
}
function status(p){const n=Number(p.stock);return n<=0?'OUT':n<=Number(p.reorderLevel)?'LOW':'OK'}
function tableSales(rows){return '<tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Date</th></tr>'+rows.map(x=>'<tr><td>'+esc(x.invoiceNo)+'</td><td>'+esc(x.customerName||'Walk-in customer')+'</td><td>'+money(x.total)+'</td><td>'+new Date(x.date).toLocaleString('en-IN')+'</td></tr>').join('')}
function tablePurchases(rows){return '<tr><th>Invoice</th><th>Supplier</th><th>Total</th><th>Date</th></tr>'+rows.map(x=>'<tr><td>'+esc(x.invoiceNo)+'</td><td>'+esc(x.supplierName||'Unknown')+'</td><td>'+money(x.total)+'</td><td>'+new Date(x.date).toLocaleString('en-IN')+'</td></tr>').join('')}

$('connectBtn').onclick=connect;
$('backupBtn').onclick=async()=>{if(!folder){message('Connect the local data folder first.','danger');return;}await saveAll();message('All data files saved. Copy the data folder anywhere for backup.')};

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.section').forEach(x=>x.classList.add('hidden'));$(b.dataset.section).classList.remove('hidden')});

$('addProductBtn').onclick=()=>{$('productForm').reset();$('productDialog').showModal()};
$('addCustomerBtn').onclick=()=>{$('customerForm').reset();$('customerDialog').showModal()};
$('addSupplierBtn').onclick=()=>{$('supplierForm').reset();$('supplierDialog').showModal()};

$('productForm').onsubmit=async e=>{e.preventDefault();const p={id:id(),sku:$('productSku').value.trim(),name:$('productName').value.trim(),brand:$('productBrand').value.trim(),category:$('productCategory').value.trim(),unit:$('productUnit').value.trim(),purchasePrice:+$('productPurchasePrice').value,sellingPrice:+$('productSellingPrice').value,stock:+$('productStock').value,reorderLevel:+$('productReorder').value};if(db.products.some(x=>x.sku===p.sku))return message('SKU already exists.','danger');db.products.push(p);if(p.stock>0)db.movements.push({id:id(),productId:p.id,type:'OPENING',quantity:p.stock,date:new Date().toISOString(),note:'Opening stock'});await saveAll();$('productDialog').close();renderAll();message('Product saved locally.')};

$('customerForm').onsubmit=async e=>{e.preventDefault();db.customers.push({id:id(),name:$('customerName').value.trim(),phone:$('customerPhone').value.trim(),address:$('customerAddress').value.trim()});await saveAll();$('customerDialog').close();renderAll();message('Customer saved locally.')};
$('supplierForm').onsubmit=async e=>{e.preventDefault();db.suppliers.push({id:id(),name:$('supplierName').value.trim(),phone:$('supplierPhone').value.trim(),email:$('supplierEmail').value.trim(),address:$('supplierAddress').value.trim()});await saveAll();$('supplierDialog').close();renderAll();message('Supplier saved locally.')};

$('saleForm').onsubmit=async e=>{e.preventDefault();const p=db.products.find(x=>x.id===$('saleProduct').value),q=+$('saleQuantity').value;if(!p||q<=0)return message('Choose a product and valid quantity.','danger');if(Number(p.stock)<q)return message('Insufficient stock. Available: '+p.stock,'danger');const customer=db.customers.find(x=>x.id===$('saleCustomer').value);const sale={id:id(),invoiceNo:'SAL-'+Date.now(),customerId:customer?.id||null,customerName:customer?.name||'Walk-in customer',date:new Date().toISOString(),total:q*Number(p.sellingPrice),items:[{productId:p.id,quantity:q,unitPrice:Number(p.sellingPrice)}]};p.stock=Number(p.stock)-q;db.sales.push(sale);db.movements.push({id:id(),productId:p.id,type:'SALE',quantity:-q,referenceId:sale.id,date:sale.date,note:sale.invoiceNo});await saveAll();e.target.reset();renderAll();message(sale.invoiceNo+' recorded for '+money(sale.total))};

$('purchaseForm').onsubmit=async e=>{e.preventDefault();const p=db.products.find(x=>x.id===$('purchaseProduct').value),q=+$('purchaseQuantity').value,cost=+$('purchaseCost').value;if(!p||q<=0||cost<0)return message('Enter valid purchase details.','danger');const s=db.suppliers.find(x=>x.id===$('purchaseSupplier').value);const purchase={id:id(),invoiceNo:'PUR-'+Date.now(),supplierId:s?.id||null,supplierName:s?.name||'Unknown supplier',date:new Date().toISOString(),total:q*cost,items:[{productId:p.id,quantity:q,unitCost:cost}]};p.stock=Number(p.stock)+q;p.purchasePrice=cost;db.purchases.push(purchase);db.movements.push({id:id(),productId:p.id,type:'PURCHASE',quantity:q,referenceId:purchase.id,date:purchase.date,note:purchase.invoiceNo});await saveAll();e.target.reset();renderAll();message(purchase.invoiceNo+' recorded for '+money(purchase.total))};

renderAll();

document.querySelectorAll('.action-card').forEach(b=>b.onclick=()=>go(b.dataset.go));
